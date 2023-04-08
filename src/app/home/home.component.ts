import { Component } from '@angular/core';
import { LocalizerService } from "src/services/localizer.service";
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  isSmallScreen = false;

  ls: LocalizerService;

  constructor(ls: LocalizerService, private router: Router) {
    this.ls = ls;
  }

  showToggle = false;
  bigScreen = false;

  panelOpenState = false;

  ngOnInit(): void {
    this.checkScreenSize();

    // subscribe to NavigationEnd event of the Router
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.checkScreenSize();
      }
    });
  }

  checkScreenSize(): void {
    this.bigScreen = window.innerWidth > 768;
    window.addEventListener("resize", event => {
      this.bigScreen = window.innerWidth > 768;
    });
  }

  changeLanguage(lang: string) {
    this.ls.setLanguage(lang);
  }
}
