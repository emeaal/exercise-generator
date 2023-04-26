import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { LocalizerService } from 'src/services/localizer.service';
import { BackendService } from 'src/backend.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WaiterComponent } from '../waiter/waiter.component';
import { HttpClient } from '@angular/common/http';
import { Clipboard } from '@angular/cdk/clipboard';


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
  validPages: string[] = ['Start', 'Review', 'Exercise options', 'View lesson'];


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

  selectedLemmas: string[] = [];
  isChosen: { [key: string]: boolean } = {};

  showToggle = false;
  bigScreen = false;
  public onlyShowExercise = false;

  panelOpenState = false;
  public drawer: any;

  public isCorrect: boolean[] = [];
  userInput: string[] = [];
  public isAnswerChecked: boolean[] = [];
  correctCount: number = 0;
  totalCount: number = 0;

  public generatedUrl: string = "";

  checkScreenSize(): void {
    this.bigScreen = window.innerWidth > 768;
    window.addEventListener("resize", event => {
      this.bigScreen = window.innerWidth > 768;
    });
  }

  changeLanguage(lang: string) {
    this.ls.setLanguage(lang);
  }
  public selectedLanguage: string = "english";

  constructor(private router: Router, private route: ActivatedRoute, private elem: ElementRef, private snack: MatSnackBar, ls: LocalizerService, private backend: BackendService, private http: HttpClient, private clipboard: Clipboard) {
    this.ls = ls;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        console.log(this.router.url);
        this.isGramXRoute = (this.router.url.startsWith('/gram-x'));
        this.lessonTitle = "";
        this.lessonNumber = "";
        this.onlyShowExercise = false;
      }
    });
  }


  navigate(page: string) {
    if (this.validPages.includes(page)) {
      this.currentPage = page;
    } else {
      this.snack.open("Invalid page!", "OK", { duration: 5000 });
    }
  }

  ngOnInit() {
    this.checkScreenSize();
    this.route.queryParams.subscribe(params => {
      const encodedId = params['id'];
      const id = decodeURIComponent(encodedId);
      if (id === 'undefined') { 
        this.currentPageNumber = 0;
      } else {
        this.backend.showData(id).subscribe(
          response => {
            const data = response;
            this.selectedLanguage = data['selectedLanguage'];
            this.lessonNumber = data['lessonNumber'];
            this.lessonTitle = data['lessonTitle'];
            this.posData = data['posData'];
            this.isChosen = data['isChosen'];
            this.onlyShowExercise = data['onlyShowExercise'];
            if (this.lessonNumber && this.lessonTitle && this.posData && this.selectedLemmas && this.onlyShowExercise) {
              this.currentPageNumber = 2;
              this.ls.setLanguage(this.selectedLanguage);
            }
          },
          error => {
            this.snack.open("Lesson not found", "OK", { duration: 5000 });
          }
        );
      }
    });
    this.loadLessons();
  }


  updateUrl(): void {
    const data = {
      lessonNumber: this.lessonNumber,
      lessonTitle: this.lessonTitle,
      posData: this.posData,
      selectedLemmas: this.selectedLemmas,
      isChosen: this.isChosen,
      onlyShowExercise: true,
    };
    this.backend.storeData(data).subscribe(response => {
      const id = response.id;
      const data = response.data;
      const encodedId = encodeURIComponent(id);
      const encodedLn = encodeURIComponent(data['lessonNumber'])
      const encodedLt = encodeURIComponent(data['lessonTitle'])
      const encodedLang = encodeURIComponent(data['selectedLanguage'])
      //this.generatedUrl = https://spraakbanken.gu.se/larkalabb/sfs/gram-x?id=${encodedId}&lessonNumber=${encodedLn}&lessonTitle=${encodedLt}&selectedLanguage=${encodedLang}`;
      this.generatedUrl = `http://localhost:4200/gram-x?id=${encodedId}&lessonNumber=${encodedLn}&lessonTitle=${encodedLt}&selectedLanguage=${encodedLang}`;
    });
  }

  copyToClipboard(): void {
    this.clipboard.copy(this.generatedUrl);
  }


  make_grammar_ex(ln: string, title: string, text: string) {
    if (!ln || !title || !text) {
      this.snack.open("Please fill out all fields!", "OK", { duration: 5000 });
      return;
    }

    this.lessonNumber = ln;
    this.lessonTitle = title;

    this.waiter.on();

    this.backend.make_grammar_ex(text).subscribe({
      next: (v) => {
        this.posData = v;

        this.waiter.off();
        this.processedText = true;
        this.selectedLemmas = this.posData.filter((obj: { checked: any; }) => obj.checked).map((obj: { lemma: any; }) => obj.lemma);
        this.next();
      },
      error: (error) => {
        this.snack.open("Something went wrong!", "OK", { duration: 5000 });
      }
    });
  }

  back() {
    this.currentPageNumber--;
    for (let i = 0; i < this.posData.length; i++) {
      this.isAnswerChecked[i] = false;
    }
  }

  next() {
    this.currentPageNumber++;
    this.currentPage = this.validPages[this.currentPageNumber];
  }

  clearForm() {
    this.lessonNumber = '';
    this.lessonTitle = '';
    this.textareaValue = '';
    this.posData = '';
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


  checkAnswers() {
    this.correctCount = 0;
    this.totalCount = 0;
    this.isCorrect = [];
    for (let i = 0; i < this.posData.length; i++) {
      const word = this.posData[i];
      if (this.isChosen[word.lemma]) {
        const input = this.userInput[i];
        const inputIndex = this.userInput.indexOf(input);

        //if we want context from gap word 
        //const wordsBefore = this.posData.slice(Math.max(0, inputIndex - 2), inputIndex);
        //const wordsAfter = this.posData.slice(inputIndex + 1, inputIndex + 3);

        //console.log(wordsBefore, input, wordsAfter);
        if (input == word.text) {
          this.isCorrect[i] = true
          this.correctCount++;
          this.totalCount++;
        } else {
          this.isCorrect[i] = false
          this.totalCount++;
        }
        this.isAnswerChecked[i] = !this.isAnswerChecked[i]; // toggle the checked state
        const gapElement = this.elem.nativeElement.querySelector(`#gap-${i}`);
        if (gapElement) {
          if (this.isAnswerChecked[i]) {
            gapElement.classList.remove('white-gap');
            gapElement.classList.add(this.isCorrect[i] ? 'correct' : 'incorrect');
          } else {
            gapElement.classList.remove('correct', 'incorrect');
            gapElement.classList.add('white-gap');
          }
        }
      }
    }
  }


}
