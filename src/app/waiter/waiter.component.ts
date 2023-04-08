import { Component } from '@angular/core';

@Component({
  selector: 'app-waiter',
  templateUrl: './waiter.component.html',
  styleUrls: ['./waiter.component.css']
})
export class WaiterComponent {
  public isWaiting: boolean = false;

  on () {
      this.isWaiting = true;
  }

  off () {
      this.isWaiting = false;
  }

}
