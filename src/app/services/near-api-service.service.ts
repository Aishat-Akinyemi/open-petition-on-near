import { Petition } from './../../models/petition';
import { Injectable } from '@angular/core';
import * as nearAPI from "near-api-js";
import { defer, from, Observable } from 'rxjs';
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  currentUser:{accountId:string, accountBal?:number}|undefined;
  private provider = new nearAPI.providers.JsonRpcProvider(environment.config.nodeUrl);
  ready:Promise<nearAPI.WalletConnection>;
  contract!: nearAPI.Contract | any;
  constructor() { 
    this.ready = new Promise((resolve, reject) => {
      const provider = new nearAPI.providers.JsonRpcProvider(environment.config.nodeUrl);
      const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore();
      let walletConnection: nearAPI.WalletConnection;
      nearAPI.connect({
      keyStore: keyStore,
      ...environment.config,
      headers: {}
      }).then((res)=> {
        walletConnection = new nearAPI.WalletConnection(res, null);
        // load the contract
        this.contract = this.setContract(walletConnection);
        resolve(walletConnection);
      }).catch(reject);    
    }); 
     
  }

  //view contract state based on key prefix. 
  //it returns the entire state if no key prefix is provided
    getPetitions():Observable<any> {    
    //encode key to base 64. this key must correspond to the key of the state storage object we are interested in
    const key64 = btoa('p');
    let obs = new Observable((observer) => {
      this.provider.query({
        request_type: "view_state",
        account_id: environment.config.contractName,      
        finality: "optimistic",
        prefix_base64:key64
      })
      .then(
        (res) =>{
          let obj:any = res;
          for (let index = 0; index < obj.values.length; index++) {
            const val = obj.values[index];
            const valueDecoded = atob(val.value);
           let json = JSON.parse(valueDecoded);
             // the petition is stored in a Persistent vector on the storage, when reading a persistentVector from storage
            // the result usually contains the length of the storage property being read
            // we are only interested in the petitions and not the length (type of length is number).  
            if(typeof(json)!=='number'){
              const petition:Petition = json;   
              //the sign method on the contract does not expect a ZERO based index. TODO: update the contract to expect zero-based indexs           
              petition.id = index+1;
              console.log(petition);
              observer.next(petition);
            }
          }
       
          observer.complete();
        }
      ).catch(
        (error) =>{
          console.log(error);
        });
    })
    return obs;
  }

    getSignatures():Observable<any> {
    const key64 = btoa("signatures");    
    let obs = new Observable((observer)=> {
      this.provider.query({
        request_type: "view_state",
        account_id: environment.config.contractName,      
        finality: "optimistic",
        prefix_base64:key64
      })
      .then(
        (res) =>{ 
          let obj:any = res;
          obj.values.forEach((value: { value: string; }) => {
            const valueDecoded = atob(value.value);
             // the signatures is stored in a Persistent vector on the storage, when reading a persistentVector from storage
          // the result usually contains the length of the storage property being read
          // we are only interested in the signatues and not the length (type of length is number).
            if(isNaN(+valueDecoded)){
              observer.next(valueDecoded);
            }           
          });                    
        }
      ).catch(
        (error) =>{
          console.log(error);
        });
    })
    return obs;
    
         

  }
    
  async signIn() { 
    const walletConnection = await this.ready;
    if (walletConnection.getAccountId()) {
      this.currentUser = {
        // Gets the accountId as a string
        accountId: walletConnection.getAccountId()        
      };
    }
    else {
      // If not signed in redirect to the NEAR wallet to sign in
      // keys will be stored in the BrowserLocalStorageKeyStore
      if(!walletConnection.isSignedIn()) {
        return walletConnection.requestSignIn(
          {contractId: environment.config.contractName, methodNames: [...environment.call_methods, ...environment.view_methods]          
          });
        } 
        this.currentUser = {
          // Gets the accountId as a string
          accountId: walletConnection.getAccountId()}       
    }       
  }
  setContract(walletConnection: nearAPI.WalletConnection):nearAPI.Contract {
    const contract = new nearAPI.Contract( 
    // accounts can only have one contract deployed to them.
      walletConnection.account(), 
      // name of contract you're connecting to
      environment.config.contractName, {
      viewMethods: environment.view_methods, // view methods do not change state but usually return a value
      changeMethods: environment.call_methods, // change methods modify state   
      });
      return contract;
  }

  signPetition(petitionId:number){
    const result = this.contract.sign(
      { petitionId: petitionId}  
      ).then(()=>console.log("successfully signed")
    );
  }

  async signPetitionWithFunds(petitionId:number, fund: string){
    const res = await this.contract.sign(
      { petitionId: petitionId},
      "300000000000000",
      nearAPI.utils.format.parseNearAmount(fund)
      );
  }

  signOut(){
    this.ready.then(
      (res) => res.signOut()
    );
    //refresh page
  }


  
}
