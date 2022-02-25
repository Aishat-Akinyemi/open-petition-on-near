import { currentUser } from './../models/currentUser';
import { Petition } from './../models/petition';
import { Component, OnInit } from '@angular/core';
import { ContractService } from "./services/near-api-service.service";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  isUserSignedIn:boolean = false;
  petitionList:Petition[] =[]; 
  currentUser!: currentUser;
  createPetitionForm : FormGroup = new FormGroup({});

  constructor(private contractService: ContractService, private fb: FormBuilder,) { 
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
    });
    this.createPetitionForm = this.fb.group({
      title: ['', Validators.required],
      body: ['', Validators.required],
      isFunded: [false, Validators.required],
      minFundAmount: [null, Validators.pattern('[0-9]*')]
    });
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
          //TODO change this to a better angular implementation but you should add routing first
          window.location.reload();
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

  createPetition(fg: FormGroup){
    if(!this.createPetitionForm.value.isFunded) this.createPetitionForm.value.minFundAmount=null    
    this.contractService.addPetition(this.createPetitionForm).subscribe({
      next:() => console.log('successfully created'),
      error:(er) => console.log(er)
    })
  }
  isValidForm():boolean{
    // if the petition is funded then the minimum fund amount should be supplied
    const isFundedHadMinFundAmount = (this.createPetitionForm.value.isFunded && this.createPetitionForm.value.minFundAmount) || !this.createPetitionForm.value.isFunded;
    if(this.createPetitionForm.valid && isFundedHadMinFundAmount && this.isUserSignedIn){
      return true;
    }
    return false;
  }
}
