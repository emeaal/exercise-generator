import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { LocalizerService } from 'src/services/localizer.service';

@Component({
  selector: 'app-url-create',
  templateUrl: './url-create.component.html',
  styleUrls: ['./url-create.component.css']
})
export class UrlCreateComponent {
  isXgenRoute = false;
  public validPos = ["NOUN", "VERB", "ADJ", "ADV", "PRON", "NUM", "ART", "SUBJ", "INTJ"];

  ls: LocalizerService;

  changeLanguage(lang: string) {
    this.ls.setLanguage(lang);
  }

  constructor(private router: Router, ls: LocalizerService) {
    this.ls = ls;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        console.log(event)
        console.log(this.router.url);
        this.isXgenRoute = (this.router.url.startsWith('/xgen'));
      }
    });
  }
}
