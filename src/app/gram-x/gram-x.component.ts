import { Component, ViewChild } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { LocalizerService } from 'src/services/localizer.service';
import { BackendService } from 'src/backend.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WaiterComponent } from '../waiter/waiter.component';
import { HttpClient } from '@angular/common/http';


export interface Lesson {
  lessonNumber: string;
  title: string;
  textareaValue: string;
}

@Component({
  selector: 'app-gram-x',
  templateUrl: './gram-x.component.html',
  styleUrls: ['./gram-x.component.css']
})
export class GramXComponent {

  @ViewChild(WaiterComponent) waiter!: WaiterComponent;

  ls: LocalizerService;
  isGramXRoute = true;
  public currentPageNumber: number = 0;
  public currentPage: string = "add";


  public lessonNumber: string = "";
  public lessonTitle: string = "";
  public textareaValue: string = '';
  public altAnswer: any[] = [];

  manualLesson!: string;
  public lessons: Lesson[] = [];
  public validLessons: Lesson[] = [];
  public posData: any;
  public processedText: boolean = false;
  lemma: any;

  isSmallScreen = false;

  showToggle = false;
  bigScreen = false;

  panelOpenState = false;
  public drawer: any;

  checkScreenSize(): void {
    this.bigScreen = window.innerWidth > 768;
    window.addEventListener("resize", event => {
      this.bigScreen = window.innerWidth > 768;
    });
  }

  changeLanguage(lang: string) {
    this.ls.setLanguage(lang);
  }

  constructor(private router: Router, private route: ActivatedRoute, private snack: MatSnackBar, ls: LocalizerService, private backend: BackendService, private http: HttpClient) {
    this.ls = ls;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        console.log(this.router.url);
        this.isGramXRoute = (this.router.url.startsWith('/gram-x'));
      }
    });
  }

  validPages: string[] = ['Start', 'Review', 'Exercise options', 'View lesson'];

  navigate(page: string) {
    if (this.validPages.includes(page)) {
      this.currentPage = page;
    } else {
      this.snack.open("Invalid page!", "OK", { duration: 5000 });
    }
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      console.log(params);
      if (params["lessonNumber"]) {
        this.lessonNumber = params["lessonNumber"].toString();
      }
      if (params["lessonTitle"]) {
        this.lessonTitle = params["lessonTitle"];
      }
      if (params["posData"]) {
        this.posData = JSON.parse(params["posData"]);
      }
      if (params["isChosen"]) {
        this.isChosen = JSON.parse(params["isChosen"]);
      }
      if (params["isCorrect"]) {
        this.isCorrect = JSON.parse(params["isCorrect"]);
      }
      if (params["selectedLemmas"]) {
        this.selectedLemmas = JSON.parse(params["selectedLemmas"]);
      }
      // Check if all required parameters are present
      if (this.lessonNumber && this.lessonTitle && this.posData && this.isChosen && this.isCorrect && this.selectedLemmas) {
        this.currentPageNumber = 2;
      } else {
        this.currentPageNumber = 0;
      }
    });
    this.loadLessons();
    this.checkScreenSize();
  
    // subscribe to NavigationEnd event of the Router
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.checkScreenSize();
      }
    });
  }
  

  updateUrl(): void {
    const queryParams = {
      lessonNumber: this.lessonNumber.toString(),
      lessonTitle: this.lessonTitle,
      posData: JSON.stringify(this.posData),
      isChosen: JSON.stringify(this.isChosen),
      isCorrect: JSON.stringify(this.isCorrect),
      selectedLemmas: JSON.stringify(this.selectedLemmas),
    };
    this.router.navigate([], { queryParams, queryParamsHandling: 'merge' });
    console.log("Updated URL: " + window.location.href);
  }
  
  

  clearForm() {
    console.log('Clearing form data');
    this.lessonNumber = '';
    this.lessonTitle = '';
    this.textareaValue = '';
    this.posData = '';
    console.log(this.posData.altAnswer)
    if (this.posData.altAnswer) {
      this.posData.altAnswer = [];
    }
  }


  loadLessons() {
    this.validLessons = [];
    for (let i = 1; i <= 25; i++) {
      const lessonNumber = i.toString();

      this.http.get(`./assets/lessons/lesson${lessonNumber}.txt`, { responseType: 'text' }).subscribe((data: string) => {
        const lines = data.split('\n');
        const title = lines[0].substring(3);
        const textareaValue = lines.slice(1).join('\n');
        const lesson: Lesson = { lessonNumber, title, textareaValue };
        this.validLessons.push(lesson);
      });
    }
  }

  reviewManualExercise() {
    const selectedLesson = this.validLessons.find(lesson => lesson.lessonNumber === this.manualLesson);
    if (selectedLesson) {
      this.lessonNumber = selectedLesson.lessonNumber;
      this.lessonTitle = selectedLesson.title;
      this.textareaValue = selectedLesson.textareaValue;
    }
  }


  public isCorrect: boolean[] = [];
  userInput: string[] = [];
  public isAnswerChecked: boolean[] = [];

  checkAnswers() {
    console.log("checking answers")
    this.isCorrect = [];
    for (let i = 0; i < this.posData.length; i++) {
      const word = this.posData[i];
      if (this.isChosen[word.lemma]) {
        const input = this.userInput[i];
        if (input == word.text) {
          this.isCorrect[i] = true
          this.isAnswerChecked[i] = true;
        }
        else if (input !== undefined)
        this.isCorrect[i] = false
        this.isAnswerChecked[i] = true;
      }
    }
    console.log("Updated URL: " + window.location.href);
  }
  
  
  
  
  selectedLemmas: string[] = [];
  isChosen: { [key: string]: boolean } = {};


  make_grammar_ex(ln: string, title: string, text: string) {
    if (!ln || !title || !text) {
      this.snack.open("Please fill out all fields!", "OK", { duration: 5000 });
      return;
    }

    this.lessonNumber = ln;
    this.lessonTitle = title;
    console.log(this.lessonNumber, this.lessonTitle, this.textareaValue);

    this.waiter.on();

    this.backend.make_grammar_ex(text).subscribe({
      next: (v) => {
        console.log(this.backend)
        this.posData = v;

        this.waiter.off();
        this.processedText = true;
        console.log("P", this.processedText)
        this.next();
        console.log("HEYY", this.posData)
        this.selectedLemmas = this.posData.filter((obj: { checked: any; }) => obj.checked).map((obj: { lemma: any; }) => obj.lemma);
      },
      error: (error) => {
        this.snack.open("Something went wrong!", "OK", { duration: 5000 });
      }
    });
    console.log("Updated URL: " + window.location.href);
  }

  checkAgreement(list1: string[], list2: string[]): void {
    for (const word of list1) {
      if (word.includes("+")) {
        const parts = word.split("+");
        if (list2.includes(parts[0]) || list2.includes(parts[1])) {
          continue;
        } else {
          console.log("incorrect");
          return;
        }
      } else if (list2.includes(word)) {
        continue;
      } else {
        console.log("incorrect");
        return;
      }
    }
  
    for (const word of list2) {
      if (word.includes("+")) {
        const parts = word.split("+");
        if (list1.includes(parts[0]) || list1.includes(parts[1])) {
          continue;
        } else {
          console.log("incorrect");
          return;
        }
      } else if (list1.includes(word)) {
        continue;
      } else {
        console.log("incorrect");
        return;
      }
    }
  
    console.log("correct");
  }



  check_grammar(ln: string, title: string, text: string) {
    if (!ln || !title || !text) {
      this.snack.open("Please fill out all fields!", "OK", { duration: 5000 });
      return;
    }

    this.lessonNumber = ln;
    this.lessonTitle = title;
    console.log(this.lessonNumber, this.lessonTitle, this.textareaValue);

    this.waiter.on();

    this.backend.process_grammar_data(text).subscribe({
      next: (v) => {
        this.posData = v;
        console.log(this.posData)
      },
      error: (error) => {
        this.snack.open("Something went wrong!", "OK", { duration: 5000 });
      }
    });
  }



  next() {
    this.currentPageNumber++;
    this.updateUrl();
    console.log("Updated URL: " + window.location.href);
  }

  back() {
    this.currentPageNumber--;
    console.log(this.currentPageNumber)
    for (let i = 0; i < this.posData.length; i++) {
      this.isAnswerChecked[i] = false;
    }
  }

}
