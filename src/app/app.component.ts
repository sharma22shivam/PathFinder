import { TripService } from './trip.service';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {map, startWith} from 'rxjs/operators';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  pathForm:FormGroup;
  error;
  pathView = false;
  currency = 'USD';
  cost;
  route = [];
  autoSource;
  autoDest;
  header = [];
  constructor(public trip: TripService) {}
  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.trip.initAdj();
    this.currency = this.trip.getCurrency();
    this.pathForm = new FormGroup({
      source: new FormControl('',Validators.required),
      destination: new FormControl('',Validators.required),
      mode: new FormControl('cost',Validators.required)
      });
    this.pathForm.valueChanges.subscribe(() => {
      if(this.error) this.error = null;
    });
    this.header= this.trip.findHeader('cost');
    this.pathForm.get('mode').valueChanges.subscribe((data) => {
        this.header = this.trip.findHeader(data);
    })

    this.autoSource =  this.pathForm.get('source').valueChanges.pipe(
        startWith(''),
        map(value => this._filter(value))
      )
    this.autoDest = this.pathForm.get('destination').valueChanges.pipe(
        startWith(''),
        map(value => this._filter(value))
      )


  }
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.header.filter(option => option.toLowerCase().includes(filterValue));
  }
  findPath() {
    this.route = [];
    this.error = null;

    if(this.header && this.header.length === 0) {
      this.error = 'No deals found. Please try again later.';
      return;
    }
    const source = this.header.findIndex((item) => item.toLowerCase() === this.pathForm.value.source.toLowerCase());
    const dest = this.header.findIndex((item) => item.toLowerCase() === this.pathForm.value.destination.toLowerCase())
    if(source < 0) {
      this.error = 'No trips found for the given Source. Please enter a different value.';
      return;
    }
     if(dest < 0) {
      this.error = 'No trips found for the given Destination. Please enter a different value.';
      return;
    }
    if(source === dest) {
       this.error = 'Source and destination cannot be same.';
      return;
    }
    this.route = this.trip.findPath(source,dest,this.pathForm.value.mode);
    this.findCost(this.pathForm.value.mode);
    this.pathView = true;
  }
  findCost(mode) {
    this.cost = 0;
    if(mode === 'cost') {
      this.route.forEach((node) => {
        let discount = (100 - +node.discount)/100;
        let c = (+node.cost)*discount;
        this.cost +=c;
      })
    }else {
      this.route.forEach((node) => {
        let timeInm = (+node.duration.h)*60 + (+node.duration.m);

        this.cost +=timeInm;
      })
      this.cost = {
          h: Math.floor(this.cost/60),
          m: this.cost % 60 === 0 ? '00' : this.cost % 60
        };
    }
    }
  backToEdit() {
    this.pathForm.reset();
    this.pathForm.patchValue({mode:'cost'});

    this.error = null;
    this.pathView = false;

    this.route = [];
    this.cost = null;
  }
}
