import { currentUser } from './../models/currentUser';
import { Petition } from './../models/petition';
import { Component, OnInit } from '@angular/core';
import { ContractService } from "./services/near-api-service.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  isUserSignedIn:boolean = false;
  petitionList:Petition[] =[]; 
  currentUser!: currentUser;
  constructor(private contractService: ContractService) { 
  } 
  ngOnInit(): void {  
    this.contractService.isSignIn().subscribe({
      next: (isUserSignedIn) => this.isUserSignedIn = isUserSignedIn
    });      
    //get all petitions by querying contract state without setting up an account
    this.contractService.getPetitions().subscribe({
      next: (data) =>{  
          data.signatures = [];
          this.petitionList.push(data);
      },
      error: (error) => {
      },
      complete: ()=> {
        //get signatures only when you've gotten all the petitions
        console.log('gotten all petitions')
        this.contractService.getSignatures().subscribe({
          next: (data:string)=>{
            const petitionIndex:number = parseInt(data[0]);
            this.petitionList[petitionIndex].signatures?.push(data.substring(2));
          }
        })
      }
    })
    
  }
  title = 'open-petition-sc-front-end';

  addPetition(){
  }
  signIn(){
    this.contractService.signIn().subscribe(      {
        next: (currentUser) => {
           this.isUserSignedIn = true;
           this.currentUser = currentUser;
        }
      }
    )
  }
  signOut(){
    this.contractService.signOut().subscribe({
      next: (isSignedOut) => {
        if(isSignedOut) {
          window.location.reload()
        }
      }

    })
  }
  signFundedPetition(petitionId:number, fund:string){
    this.contractService.signPetitionWithFunds(petitionId, fund);
  }
  signUnfundedPetition(petitionId: number){
    this.contractService.signPetition(petitionId);
  }
}
