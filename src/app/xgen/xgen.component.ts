import { Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
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

  changeLanguage(lang: string) {
    this.ls.setLanguage(lang);
  }
  isXgenRoute = true;

  @ViewChild(WaiterComponent) waiter!: WaiterComponent;


  //links = ['Home', 'Add new text', 'View all texts', 'Options', 'Preview', 'Shout'];
  //activeLink = this.links[this.selectedIndex];
  //identified = true;
  public xlangs: string[] = ['Swedish', 'English'];
  selectedIndex = 0;

  currentTab!: string;
  validPages: string[] = ['Home', 'Add new text', 'View all texts', 'Options', 'Preview'];
  // currentPage: string = 'Home';

  isChecked: { [key: string]: boolean } = {};
  public selectedEveryX: any = '4';
  distanceToPrevInputBox: number = this.selectedEveryX;

  public currentPage: string = "add";
  public processedText: boolean = false;
  public posData: any;
  //public validPosTEST = ["NOUN", "VERB", "ADJ", "ADV", "PRON", "NUM", "ART", "SUBJ", "INTJ", "PREP"];
  //public validPosTEST = ["NOUN", "VERB", "ADJ", "ADV", "PRON", "NUM", "ART", "SUBJ", "INTJ", "PREP", "ADP", "PUNCT", "PROPN", "DET", "CCONJ", "SCONJ", "AUX", "PART"];
  //public validPos = ["AB", "DT", "HA", "HD", "HP", "HS", "IE", "IN", "JJ", "KN", "NN", "PC", "PL", "PM", "PN", "PP", "PS", "RG", "RO", "SN", "UO", "VB", "UTR", "NEU", "MAS", "UTR/NEU", "-", "SIN", "PLU", "SIN/PLU", "-", "IND", "DEF", "IND/DEF", "-", "NOM", "GEN", "SMS", "-", "POS", "KOM", "SUV", "SUB", "OBJ", "SUB/OBJ", "PRS", "PRT", "INF", "SUP", "IMP", "AKT", "SFO", "KON", "PRF", "AN", "MAD", "MID", "PAD"]
  public validPos = ["AB", "DT", "HA", "HD", "HP", "HS", "IE", "IN", "JJ", "KN", "NN", "PC", "PL", "PM", "PN", "PP", "PS", "RG", "RO", "SN", "UO", "VB"];
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


  constructor(private snack: MatSnackBar, private backend: BackendService, ls: LocalizerService, private http: HttpClient,
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
  }

  clearForm() {
    console.log('Clearing form data');
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
        console.log("P", this.processedText)
        this.next();
        console.log("HEYY", this.posData)
       // console.log("posdata:", this.posData, "p text: ", this.processedText);
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

  onEveryXChanged() {
    console.log('Selected everyX:', this.selectedEveryX);
  }

  

  shouldRenderInputBox(index: number): boolean {
    let lastCheckedIndex = -1;
    
    for (let i = index - 1; i >= 0; i--) {
      if (this.validPos.includes(this.posData[i].pos)) {
        lastCheckedIndex = i;
        break;
      }
    }
    
    const distance = index - lastCheckedIndex;
    
    // Render an input box after every Nth word
    return distance >= this.selectedEveryX && distance % this.selectedEveryX === 0;
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

    this.backend.process3(this.posData, this.checkedVPos, parseInt(this.selectedEveryX), this.excludeFirstSentence, this.excludeLastSentence).subscribe({
      next: (v) => {
        this.renderedData = v;
      }
    });
    

    console.log(Object.keys(this.isChecked).filter(vPos => this.isChecked[vPos]))

    this.isAnswerChecked = [];

    console.log(this.selectedEveryX);
    console.log(this.posData); // make sure the posData array contains the expected objects


    //for (let word of this.posData) {
    //console.log(word.accept); // check if the word object has an accept property
    //}
  }

  userInput: string[] = [];

  //isCorrect: boolean = false;
  public correctAnswer: string[] = [];
  public wrongAnswer: string[] = [];
  public isCorrect: boolean = false;


  isAnswerChecked: boolean[] = [];

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
        this.isCorrect = true;
        this.isAnswerChecked[i] = true;
        this.correctCount++;
        this.totalCount++;
      } else if (input !== undefined) {
        console.log(`This was wrong: ${input}`);
        this.wrongAnswer.push(input);
        this.isAnswerChecked[i] = false;
        this.isCorrect = false;
        this.totalCount++;
      }

    }
    console.log(`Correct answers: ${this.correctCount} out of ${this.totalCount}`);
  }

  showAnswers() {
    const gaps = this.elem.nativeElement.querySelectorAll(".gap");
    console.log(gaps);
    for (let i = 0; i < gaps.length; i++) {
      const gapElement = gaps[i] as HTMLInputElement | null;
      if (gapElement) {
        const firstAnswer = gapElement["accept"].split(",")[0];
        gapElement.value = firstAnswer;
        gapElement.classList.remove("incorrect-answer");
        const gapElementCLArray = Array.from(gapElement.classList);
        console.log(gapElementCLArray);
        if (!gapElementCLArray.includes("correct-answer")) {
          gapElement.classList.add("provided-answer");
        }
      }
    }
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

}
