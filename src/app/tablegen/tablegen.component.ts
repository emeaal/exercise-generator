import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { LocalizerService } from 'src/services/localizer.service';
import { MatSnackBar } from "@angular/material/snack-bar";
import { WaiterComponent } from '../waiter/waiter.component';
import { BackendService } from "src/backend.service";
import { forEach } from 'angular';

interface InflectionData {
  [inflection: string]: string[];
}

@Component({
  selector: 'app-tablegen',
  templateUrl: './tablegen.component.html',
  styleUrls: ['./tablegen.component.css']
})
export class TablegenComponent {
  @ViewChild(WaiterComponent) waiter!: WaiterComponent;
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

  constructor(private router: Router, private snack: MatSnackBar, ls: LocalizerService, private backend: BackendService) {
    this.ls = ls;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        console.log(this.router.url);
        this.isTablegenRoute = (this.router.url.startsWith('/tablegen'));
      }
    });
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
  }

  back_to_tables() {
    this.currentPageNumber--;
  }

  clearAll() {
    console.log("Returning to initial state")
    this.inputValues = [''];
    this.currentPageNumber = 0;
    this.allMsdWords = [];
    this.tableData = [];
    this.isChecked = {};
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



  create_big_table() {
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

          this.tableData.push({
            wordClass: wordClass,
            headers: Object.keys(words[0].inflections),
            rows: words.map((word: { word: any; inflections: Record<string, string[]>; }) => ({
              word: word.word,
              values: Object.values(word.inflections).map(val => val.join(", "))
            }))
          });
        }
        console.log(this.tableData)

        this.waiter.off();
      },
      error: (error) => {
        this.snack.open("Something went wrong!", "OK", { duration: 5000 });
      }
    });

    this.next();
  }

  public generatedTable: any[] = [];

  generateTable() {
    this.currentPageNumber++;
  
    // create a deep copy of tableData
    const newTableData = JSON.parse(JSON.stringify(this.tableData));
  
    // modify the new table data
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
    }});
  
    // set the generated table to the new table data
    this.generatedTable = newTableData;
  }

  clickedCells: {rowIndex: number, columnIndex: number}[] = [];

  onCellClick(event: MouseEvent, table: any, rowIndex: number, columnIndex: number) {
    console.log("click")
  }
  
  public isCorrect: boolean = false;
  
  checkAnswers() {
    console.log("checking answers...")
    for (let i = 0; i < this.tableData.length; i++) {
      for (let j = 0; j < this.tableData[i].rows.length; j++) {
        for (let k = 0; k < this.tableData[i].rows[j].values.length; k++) {
          const expectedValue = this.tableData[i].rows[j].values[k];
          console.log(expectedValue)
          const userValue = this.generatedTable[i].rows[j].values[k];
          if (userValue === expectedValue) {
            this.isCorrect = true;
          } else {
            this.isCorrect = false;
          }       
          console.log(expectedValue, ":", userValue, ":", this.isCorrect)   
        }
      }
    }
  }
  
  

}
