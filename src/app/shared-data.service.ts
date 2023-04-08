import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {
  public formData: any = {};

  constructor() {}

  setFormData(ln: string, title: string, text: string) {
    console.log("setFormData called with", ln, title, text);
    this.formData = {ln, title, text};
    console.log("formData is now", this.formData);
  }

  getFormData() {
    console.log("getFormData called, returning", this.formData);
    return this.formData;
  }

  setExerciseData() {
    console.log("testing")
  }

  getExerciseData() {
    console.log("testing get xgen")
  }

  clear() {
    console.log("clear called");
    this.formData = {};
    console.log("formData is now", this.formData);
  }
}

