import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { LocalizerService } from 'src/services/localizer.service';
import { MatSnackBar } from "@angular/material/snack-bar";
import { WaiterComponent } from '../waiter/waiter.component';
import { BackendService } from "src/backend.service";

@Component({
  selector: 'app-tablegen',
  templateUrl: './tablegen.component.html',
  styleUrls: ['./tablegen.component.css']
})
export class TablegenComponent {
  @ViewChild(WaiterComponent) waiter!: WaiterComponent;
  @ViewChild('input', { static: false })
  input!: ElementRef;
  isTablegenRoute = true;
  public validPos = ["NOUN", "VERB", "ADJ", "ADV", "PRON", "NUM", "ART", "SUBJ", "INTJ"];
  public currentPageNumber: number = 0;

  ls: LocalizerService;
  public msdWords: any;
  wordInputs: any;
  entry: any;
  allMsdWords: any;
  tableData: any[] = [];
  i: any;
  expectedValue: any;
  userValue: any;
  k: any;


  changeLanguage(lang: string) {
    this.ls.setLanguage(lang);
  }

  constructor(private router: Router, private snack: MatSnackBar, ls: LocalizerService, private backend: BackendService, private elem: ElementRef) {
    this.ls = ls;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        console.log(this.router.url);
        this.isTablegenRoute = (this.router.url.startsWith('/tablegen'));
      }
    });
  }

  ngOnInit() {
  }

  public word: string = '';
  public words: string[] = [];
  public inputValues: string[] = [];

  public exerciseChoices = ["Random empty", "All def", "All indef", "All sing", "All plural", "Choose manually"];

  public isChecked: { [choice: string]: boolean } = {};



  next() {
    this.currentPageNumber++;

  }

  back() {
    this.currentPageNumber--;
    console.log(this.currentPageNumber)
    this.tableData = [];
    this.isAnswerChecked = [];
  }

  back_to_tables() {
    this.currentPageNumber--;
    this.isAnswerChecked = [];
  }

  clearAll() {
    console.log("Returning to initial state")
    this.inputValues = [''];
    this.currentPageNumber = 0;
    this.allMsdWords = [];
    this.tableData = [];
    this.isChecked = {};
    this.clickedCells = [];
    this.isAnswerChecked = [];
  }

  addInputField() {
    this.words.push('');
    this.inputValues.push('');
  }


  deleteInputField(index: number) {
    this.words.splice(index, 1);
    this.inputValues.splice(index, 1);
  }


  onInputChange(event: any, index: number) {
    this.inputValues[index] = event.target.value;
    console.log("on input change")
  }

  noun_headers = ['sg indef nom', 'sg indef gen', 'sg def nom', 'sg def gen', 'pl indef nom', 'pl indef gen', 'pl def nom', 'pl def gen']
  verb_headers = ['imper', 'inf aktiv', 'pres ind aktiv', 'pret ind aktiv', 'sup aktiv']
  adj_headers = ['pos indef sg u nom', 'pos indef sg n nom', 'pos indef pl nom', 'komp nom', 'super indef nom']

  create_big_table() {
    this.tableData = [];
    this.isChecked = {};
    this.clickedCells = {};
    const inputFields = document.querySelectorAll('input[type="text"]');
    this.inputValues = Array.from(inputFields).map(input => (input as HTMLInputElement).value.trim());
    console.log(this.inputValues);

    if (!this.inputValues.some(value => value)) {
      this.snack.open("Please fill out at least one field!", "OK", { duration: 5000 });
      return;
    }

    const words = this.inputValues.filter(value => value);
    console.log(typeof words);
    console.log(words);
    this.waiter.on();

    const wordString = (words as any[]).join(",");
    this.backend.create_table(wordString).subscribe({
      next: (allMsdWords: any) => {
        console.log(allMsdWords)
        // Group the words by word class
        const groupedData = allMsdWords.reduce((acc: { [x: string]: any[]; }, curr: { wordClass: any; }) => {
          const { wordClass } = curr;
          if (!acc[wordClass]) {
            acc[wordClass] = [];
          }
          acc[wordClass].push(curr);
          return acc;
        }, {});

        // Display the data in tables
        for (const wordClass in groupedData) {
          const words = groupedData[wordClass];

          // Skip word class if there are no words in it
          if (words.length === 0) {
            continue;
          };

          let headers = Object.keys(words[0].inflections);

          // Check if the headers match with the headers defined for each part of speech
          if (this.noun_headers.includes(headers[0])) {
            headers = this.noun_headers;
          } else if (this.verb_headers.includes(headers[0])) {
            headers = this.verb_headers;
          } else if (this.adj_headers.includes(headers[0])) {
            headers = this.adj_headers;
          }

          this.tableData.push({
            wordClass: wordClass,
            headers: headers,
            rows: words.map((word: { word: any; inflections: Record<string, string[]>; }) => ({
              word: word.word,
              values: headers.map(header => {
                if (word.inflections[header]) {
                  return word.inflections[header].join(", ");
                } else {
                  return "";
                }
              })
            }))
          });
        }
        this.waiter.off();
        console.log(this.tableData)
        if (allMsdWords.length === 0) {
          this.snack.open("Word could not be found in database", "OK", { duration: 5000 });
        }
      },


      error: (error) => {
        this.snack.open("Something went wrong!", "OK", { duration: 5000 });
      }
    });
    setTimeout(() => {
      this.next();
    }, 1500);
  }


  public generatedTable: any[] = [];

  generateTable() {
    this.currentPageNumber++;

    // create a deep copy of tableData
    const newTableData = JSON.parse(JSON.stringify(this.tableData));
    console.log('tableData:', this.tableData);
    console.log('newTableData:', newTableData);


    Object.values(this.clickedCells).forEach((clickedCellsArray) => {
      clickedCellsArray.forEach((clickedCell) => {
        const { tableIndex, rowIndex, columnIndex } = clickedCell;
        const table = newTableData[tableIndex];
        if (table && table.rows[rowIndex]) {
          table.rows[rowIndex].values[columnIndex] = '';
        }
      });
    });

    // get random cells
    newTableData.forEach((table: { rows: { values: any[]; }[]; headers: any[]; }) => {
      // if Random empty is checked, randomly select cells to leave empty
      if (this.isChecked['Random empty']) {
        table.rows.forEach((row: { values: any[]; }) => {
          row.values = row.values.map((value) => {
            return Math.random() < 0.5 ? '' : value;
          });
        });
      }

      // if All def is checked, set cells under headers containing 'def' to empty string
      if (this.isChecked['All def']) {
        table.headers.forEach((header, index) => {
          if (header.includes(' def')) {
            table.rows.forEach((row: { values: any[]; }) => {
              row.values[index] = '';
            });
          }
        });
      }

      if (this.isChecked['All indef']) {
        table.headers.forEach((header, index) => {
          if (header.includes('indef')) {
            table.rows.forEach((row: { values: any[]; }) => {
              row.values[index] = '';
            });
          }
        });
      }
      if (this.isChecked['All sing']) {
        table.headers.forEach((header, index) => {
          if (header.includes('sg')) {
            table.rows.forEach((row: { values: any[]; }) => {
              row.values[index] = '';
            });
          }
        });
      }

      if (this.isChecked['All plural']) {
        table.headers.forEach((header, index) => {
          if (header.includes('pl ')) {
            table.rows.forEach((row: { values: any[]; }) => {
              row.values[index] = '';
            });
          }
        });
      }
    });

    // set the generated table to the new table data
    this.generatedTable = newTableData;
    console.log(this.generatedTable)
    for (let i = 0; i < this.tableData.length; i++) {
      for (let j = 0; j < this.tableData[i].rows.length; j++) {
        for (let k = 0; k < this.tableData[i].rows[j].values.length; k++) {
          this.isAnswerChecked[k] = false;
          console.log(this.isAnswerChecked)
        }
      }
    }

  }

  public clickedCells: { [tableIndex: number]: { rowIndex: number, columnIndex: number, tableIndex: number }[] } = {};


  onCellClick(event: MouseEvent, tableIndex: number, rowIndex: number, columnIndex: number) {
    const clickedCell: { tableIndex: number, rowIndex: number, columnIndex: number } = { tableIndex, rowIndex, columnIndex };

    const clickedCellIndex = this.clickedCells[tableIndex]?.findIndex((cell: { tableIndex: number; rowIndex: number; columnIndex: any; }) => cell.rowIndex === rowIndex && cell.columnIndex === columnIndex);

    if (clickedCellIndex > -1) {
      // Cell is already clicked, so remove it from the clickedCells array
      this.clickedCells[tableIndex].splice(clickedCellIndex, 1);
    } else {
      // Cell is not already clicked, so add it to the clickedCells array
      if (!this.clickedCells[tableIndex]) {
        this.clickedCells[tableIndex] = [];
      }
      this.clickedCells[tableIndex].push(clickedCell);
    }

    const clickedCellElement = (event.target as Element).closest('.table-cell');
    if (clickedCellElement) {
      clickedCellElement.classList.toggle('clicked');

    }
  }


  isCellClicked(tableIndex: number, rowIndex: number, columnIndex: number): boolean {
    if (!this.clickedCells[tableIndex]) {
      return false;
    }
    return this.clickedCells[tableIndex].some(cell => cell.rowIndex === rowIndex && cell.columnIndex === columnIndex);
  }

  public isCorrect: boolean[] = [];
  userInput: string[] = [];
  public correctAnswer: string[] = [];
  public wrongAnswer: string[] = [];

  public isAnswerChecked: boolean[] = [];

  checkAnswers() {
    console.log(this.isAnswerChecked)
    for (let i = 0; i < this.tableData.length; i++) {
      for (let j = 0; j < this.tableData[i].rows.length; j++) {
        for (let k = 0; k < this.tableData[i].rows[j].values.length; k++) {
          const expectedAnswer = this.tableData[i].rows[j].values[k]
          const userAnswer = this.generatedTable[i].rows[j].values[k]
          if (expectedAnswer !== userAnswer) {
            this.isAnswerChecked[k] = true;
            this.isCorrect[k] = false;
          } else {
            this.isAnswerChecked[k] = true;
            this.isCorrect[k] = true;
          }
        }
      }
    }
    console.log(this.isAnswerChecked)
  }  

}
