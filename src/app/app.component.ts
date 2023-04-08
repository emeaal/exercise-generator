import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title(title: any) {
    throw new Error('Method not implemented.');
  }
  showXgenMenu = false;

  toggleXgenMenu() {
    this.showXgenMenu = !this.showXgenMenu;
  }
}
