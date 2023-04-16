import { Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { WaiterComponent } from '../waiter/waiter.component';
import { BackendService } from "src/backend.service";
import { LocalizerService } from 'src/services/localizer.service';


export interface Lesson {
  lessonNumber: string;
  title: string;
  textareaValue: string;
}

@Component({
  selector: 'app-xgen',
  templateUrl: './xgen.component.html',
  styleUrls: ['./xgen.component.css']
})


export class XgenComponent {

  ls: LocalizerService;
  gapIndexes: any;

  changeLanguage(lang: string) {
    this.ls.setLanguage(lang);
  }
  isXgenRoute = true;

  @ViewChild(WaiterComponent) waiter!: WaiterComponent;

  public xlangs: string[] = ['Swedish', 'English'];
  selectedIndex = 0;

  currentTab!: string;
  validPages: string[] = ['Home', 'Add new text', 'View all texts', 'Options', 'Preview'];

  isChecked: { [key: string]: boolean } = {};
  public selectedEveryX: any = '4';
  distanceToPrevInputBox: number = this.selectedEveryX;

  public currentPage: string = "add";
  public processedText: boolean = false;
  public posData: any;
  public validPos = ["AB", "DT", "HA", "HD", "HP", "HS", "IE", "IN", "JJ", "KN", "NN", "PC", "PL", "PM", "PN", "PP", "PS", "RG", "RO", "SN", "UO", "VB", "MAD", "MID"];
  public posLabels: {[key: string]: string} = {
    "AB": "Adverb",
    "DT": "Determiner",
    "IN": "Preposition",
    "JJ": "Adjective",
    "KN": "Conjunction",
    "NN": "Noun",
    "PC": "Particle",
    "PM": "Proper Noun",
    "PN": "Pronoun",
    "PP": "Personal Pronoun",
    "PS": "Possessive Pronoun",
    "RG": "Relative Adverb",
    "UO": "Interjection",
    "VB": "Verb",
  };
  public validLabels = this.validPos.filter(pos => this.posLabels[pos]);

  
  public uniquePos: string[] = [];
  public showValidPos: boolean = false;

  public currentPageNumber: number = 0;


  public lessonNumber: string = "";
  public lessonTitle: string = "";
  public textareaValue: string = '';
  public altAnswer: any[] = [];

  manualLesson!: string;
  public lessons: Lesson[] = [];
  public validLessons: Lesson[] = [];

  private disabledNumbers: any = [];

  correctCount: number = 0;
  totalCount: number = 0;


  constructor(private snack: MatSnackBar, public route: ActivatedRoute, private backend: BackendService, ls: LocalizerService, private http: HttpClient,
    private elem: ElementRef) {
    this.ls = ls;
  }

  navigate(page: string) {
    if (this.validPages.includes(page)) {
      this.currentPage = page;
    } else {
      this.snack.open("Invalid page!", "OK", { duration: 5000 });
    }
  }

  ngOnInit() {
    this.loadLessons();
    this.route.queryParams.subscribe(params => {
      console.log(params['language']);
      console.log(params['lessonNumber']);
    });
  }

  clearForm() {
    this.lessonNumber = '';
    this.lessonTitle = '';
    this.textareaValue = '';
    this.isChecked = {};
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



  process(ln: string, title: string, text: string) {
    if (!ln || !title || !text) {
      this.snack.open("Please fill out all fields!", "OK", { duration: 5000 });
      return;
    }

    this.lessonNumber = ln;
    this.lessonTitle = title;
    console.log(this.lessonNumber, this.lessonTitle, this.textareaValue);

    this.waiter.on();

    this.backend.process(text).subscribe({
      next: (v) => {
        console.log(this.backend)
        this.posData = v;

        this.posData.forEach((item: any) => {
          item.accept = item.text;
        });

        this.waiter.off();
        this.processedText = true;
        this.next()
      },
      error: (error) => {
        this.snack.open("Something went wrong!", "OK", { duration: 5000 });
      }
    });
  }


  next() {
    this.currentPageNumber++;
  }

  back() {
    this.currentPageNumber--;
    console.log(this.currentPageNumber)
    this.correctCount = 0;
    if (this.userInput) {
      this.userInput = [];
    }
  }

  discard() {
    this.posData = "";
    this.processedText = false;
    this.disabledNumbers = [];
  }

  insertLinebreak(i: number) {
    if (!this.disabledNumbers.includes(i)) {
      this.posData.splice(i + 1, 0, { "lemma": "<br/><br/>", "pos": "LINEBREAK", "text": "<br/><br/>", "sent_id": -1, "max_sent_id": 0 });
      this.disabledNumbers.push(i);
    } else {
      this.posData.splice(i + 1, 1);
      this.disabledNumbers.splice(this.disabledNumbers.indexOf(i), 1);
    }
  }

  getIsDisabled(i: number) {
    if (this.disabledNumbers.includes(i)) {
      return true;
    }
    return false;
  }

  deleteWord(i: number) {
    this.posData.splice(i, 1);
  }

  togglePos() {
    this.showValidPos = !this.showValidPos;
  }


  public checkedVPos: any;
  public excludeFirstSentence = true;
  public excludeLastSentence = true;
  public sentences: any;
  lastIndex = 0;
  
  renderedData: any;

  preview() {
    this.currentPageNumber++;
    console.log(this.altAnswer);
    this.sentences = this.textareaValue.split('.').filter(sentence => sentence.trim() !== '');
    console.log(this.sentences);

    console.log(this.posData)
    this.checkedVPos = Object.keys(this.isChecked).filter(vPos => this.isChecked[vPos]);
    console.log(this.checkedVPos); // print the selected vPos values
    this.waiter.on();

    //this.excludeFirstSentence, this.excludeLastSentence
    this.backend.process3(this.posData, this.checkedVPos, parseInt(this.selectedEveryX), this.excludeFirstSentence, this.excludeLastSentence).subscribe({
      next: (v) => {
        this.renderedData = v;
        console.log(this.excludeFirstSentence, this.excludeLastSentence)
        console.log("RENDERED:", this.renderedData)
      }
    });

    this.waiter.off();
    

    console.log(Object.keys(this.isChecked).filter(vPos => this.isChecked[vPos]))


    console.log(this.selectedEveryX);
    console.log(this.posData); // make sure the posData array contains the expected objects

  }

  userInput: string[] = [];

  public correctAnswer: string[] = [];
  public wrongAnswer: string[] = [];
  public isCorrect: boolean[] = [];


  public isAnswerChecked: boolean[] = [];

  AreAnswersChecked: boolean = false;

  checkAnswers() {
    this.correctCount = 0;
    this.totalCount = 0;
    for (let i = 0; i < this.posData.length; i++) {
      const word = this.posData[i];
      const input = this.userInput[i];
      if (input && (input === word.accept || (word.altAnswer && word.altAnswer.includes(input)))) {
        console.log(`This was correct: ${input}`);
        this.correctAnswer.push(input);
        this.isCorrect[i] = true;
        this.isAnswerChecked[i] = true;
        console.log(this.isAnswerChecked[i])
        this.correctCount++;
        this.totalCount++;
      } else if (input !== undefined) {
        console.log(`This was wrong: ${input}`);
        this.wrongAnswer.push(input);
        this.isAnswerChecked[i] = true;
        console.log(this.isAnswerChecked[i])
        this.isCorrect[i] = false;
        this.totalCount++;
      }

    }
    console.log('isAnswerChecked:', this.isAnswerChecked);
    console.log(`Correct answers: ${this.correctCount} out of ${this.totalCount}`);
  }

  private answersShown = false;

  
  showAnswers() {
    console.log("showing")
    this.isAnswerChecked = [];
    const gaps = this.elem.nativeElement.querySelectorAll('.gap');
    if (this.answersShown) {
      // hide the answers
      for (let i = 0; i < gaps.length; i++) {
        const gapElement = gaps[i] as HTMLInputElement | null;
        if (gapElement) {
          const id = parseInt(gapElement.id.split('-')[1]);
          if (this.userInput[id]) {
            gapElement.value = this.userInput[id];
          } else {
            gapElement.value = ''; // set empty value if userInput is not defined
          }
          gapElement.classList.remove('correct', 'wrong');
          gapElement.classList.add('white-gap');
        }
      }
    } else {
      // show the answers
      for (let i = 0; i < gaps.length; i++) {
        const gapElement = gaps[i] as HTMLInputElement | null;
        if (gapElement) {
          const index = parseInt(gapElement.id.split('-')[1], 10);
          const word = this.posData[index];
          gapElement.value = word.accept.split(',')[0];
          gapElement.classList.remove('wrong', 'white-gap');
          gapElement.classList.add('correct');
        }
      }
    }
    this.answersShown = !this.answersShown;
  }
  

public showItems = true;
public showListItems = false;

public toggleList() {
  this.showListItems = !this.showListItems;
}

  debug() {
    this.backend.process2(this.posData, true, true, 4).subscribe({
      next: (v) => {
        console.log(v);
      },
      error: (msg) => { },
      complete: () => { }
    })
  }

  public forceStartExercise: boolean = false;

  public final_url: string = "";
  public selectedLanguage: string = "english";

  queryParams = {
    language: 'English',
    lessonNumber: this.lessonNumber,
  };
  

  generateUrl(fxm: boolean) {
    let url = "http://localhost:4200/xgen"
    if (fxm) {
        url += "&fxm=true";
    }
    this.final_url = url;
}
  

}
