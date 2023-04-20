import { Component, ViewChild } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { LocalizerService } from 'src/services/localizer.service';
import { MatSnackBar } from "@angular/material/snack-bar";
import { WaiterComponent } from '../waiter/waiter.component';
import { BackendService } from "src/backend.service";
import { Clipboard } from '@angular/cdk/clipboard';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tablegen',
  templateUrl: './tablegen.component.html',
  styleUrls: ['./tablegen.component.css']
})
export class TablegenComponent {
  @ViewChild(WaiterComponent) waiter!: WaiterComponent;

  ls: LocalizerService;

  checkScreenSize(): void {
    this.bigScreen = window.innerWidth > 768;
    window.addEventListener("resize", event => {
      this.bigScreen = window.innerWidth > 768;
    });
  }

  changeLanguage(lang: string) {
    this.ls.setLanguage(lang);
    this.selectedLanguage = lang;
  }
  public selectedLanguage: string = "english";

  isTablegenRoute = true;
  public currentPageNumber: number = 0;
  public generatedUrl: string = "";

  bigScreen = false;
  onlyShowExercise = false;

  panelOpenState = false;
  public drawer: any;

  public exerciseChoices = ["Random empty", "Choose manually"];

  public msdWords: any;
  wordInputs: any;

  entry: any;
  allMsdWords: any;
  tableData: any[] = [];

  noun_headers = ['sg indef nom', 'sg indef gen', 'sg def nom', 'sg def gen', 'pl indef nom', 'pl indef gen', 'pl def nom', 'pl def gen']
  verb_headers = ['imper', 'inf aktiv', 'pres ind aktiv', 'pret ind aktiv', 'sup aktiv']
  adj_headers = ['pos indef sg u nom', 'pos indef sg n nom', 'pos indef pl nom', 'komp nom', 'super indef nom']

  none_words: string[] = [];
  add_manual_rows: boolean = false;

  public generatedTable: any[] = [];

  expectedValue: any;
  expectedAnswer: any;
  userValue: any;
  k: any;
  i: any;
  public word: string = '';
  public words: string[] = [];
  public inputValues: string[] = [];
  userInput: string[] = [];
  public correctAnswer: string[] = [];
  public wrongAnswer: string[] = [];


  isAnswerChecked: boolean[] = [];
  isCorrect: boolean[][] = [];
  public isCellFilled: boolean[][] = [];


  public isChecked: { [choice: string]: boolean } = {};

  constructor(private router: Router, private route: ActivatedRoute, 
    private snack: MatSnackBar, ls: LocalizerService, private backend: BackendService, private http: HttpClient, private clipboard: Clipboard) {
    this.ls = ls;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        console.log(this.router.url);
        this.isTablegenRoute = (this.router.url.startsWith('/tablegen'));
      }
    });
  }

  ngOnInit() {
    this.checkScreenSize();
    this.add_manual_rows = false;
    this.add_new_row = false;
    this.show_save_button = false;
    this.route.queryParams.subscribe(params => {
      console.log(params)
      const encodedId = params['id'];
      const id = decodeURIComponent(encodedId); // decode the ID using decodeURIComponent()
      if (id === 'undefined') { // check if id is undefined
        this.currentPageNumber = 0;
      } else {
        this.backend.showData(id).subscribe({
          next: response => {
            const data = response;
            this.generatedTable = data['generatedTable'];
            this.tableData = data['tableData']
            this.selectedLanguage = data['selectedLanguage']
            this.onlyShowExercise = data['onlyShowExercise']
            if (this.generatedTable) {
              this.currentPageNumber = 3;
              this.ls.setLanguage(this.selectedLanguage);
              this.isCorrect = new Array(this.generatedTable.length);
              this.isCellFilled = new Array(this.generatedTable.length);
              for (let i = 0; i < this.generatedTable.length; i++) {
                const table = this.generatedTable[i];
                this.isCorrect[i] = new Array(table.rows.length).fill(false);
                this.isCellFilled[i] = new Array(table.rows.length).fill(false);
              }
            }            
          },
          error: error => {
            this.snack.open("Page not found", "OK", { duration: 5000 });
          }
        });        
      }
    });
  }

  updateUrl(): void {
    const data = {
      generatedTable: this.generatedTable,
      tableData: this.tableData,
      isCellFilled: this.isCellFilled,
      onlyShowExercise: true,
      selectedLanguage: this.selectedLanguage
    };
    this.backend.storeData(data).subscribe(response => {
      const id = response.id;
      const data = response.data;
      const encodedId = encodeURIComponent(id); 
      const encodedLang = encodeURIComponent(this.selectedLanguage)
      //https://spraakbanken.gu.se/larkalabb/sfs/tablegen?id=${encodedId}&lang=${encodedLang}`;
      this.generatedUrl = `http://localhost:4200/tablegen?id=${encodedId}&lang=${encodedLang}`;
      console.log(this.generatedUrl)
    });
  }

  copyToClipboard(): void {
    this.clipboard.copy(this.generatedUrl);
  }


  next() {
    this.currentPageNumber++;
  }


  back() {
    this.currentPageNumber--;
    this.tableData = [];
    this.isAnswerChecked = [];
    this.none_words = [];
  }


  back_to_tables() {
    this.currentPageNumber--;
    this.isAnswerChecked = [];
  }


  clearAll() {
    this.inputValues = [''];
    this.currentPageNumber = 0;
    this.allMsdWords = [];
    this.tableData = [];
    this.isChecked = {};
    this.clickedCells = [];
    this.isAnswerChecked = [];
    this.none_words = [];
    this.add_manual_rows = false;
    this.add_new_row = false;
    this.show_save_button = false;
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
  }


  create_big_table() {
    this.tableData = [];
    this.isChecked = {};
    this.clickedCells = {};
    const inputFields = document.querySelectorAll('input[type="text"]');
    this.inputValues = Array.from(inputFields).map(input => (input as HTMLInputElement).value.trim());


    if (!this.inputValues.some(value => value)) {
      this.snack.open("Please fill out at least one field!", "OK", { duration: 5000 });
      return;
    }

    const words = this.inputValues.filter(value => value);
    this.waiter.on();

    const wordString = (words as any[]).join(",");
    this.backend.create_table(wordString).subscribe({
      next: (allMsdWords: any) => {
        console.log(allMsdWords)
        // Group the words by word class
        const groupedData = allMsdWords.reduce((acc: { [x: string]: any[]; }, curr: {
          word: any; wordClass: any; inflections: any;
        }) => {
          const { wordClass, inflections } = curr;
          if (!acc[wordClass]) {
            acc[wordClass] = [];
          }
          if (inflections === "None") {
            this.snack.open(`${curr.word} could not be found in database`, "OK", { duration: 5000 });
            this.none_words.push(curr.word)
          } else {
            acc[wordClass].push(curr);
          }
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
        console.log(this.none_words)
        if (this.none_words.length >= 1) {
          this.add_manual_rows = true;
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

  add_new_row: boolean = false;
  show_save_button: boolean = false;
  newRow: any = {};

  addNewRow(table: any) {
    this.add_new_row = true;
    this.show_save_button = true;
    this.newRow = {};
    table.headers.forEach((header: string) => {
      this.newRow[header] = '';
    });
    table.rows.push({ values: [] });
  }
  saveNewRow(table: any) {
    table.rows[table.rows.length - 1].values = Object.values(this.newRow);
    this.newRow = {};
  }


  generateTable() {
    this.currentPageNumber++;
    // create deep copy of tableData
    const newTableData = JSON.parse(JSON.stringify(this.tableData));

    // handle clicked cells
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
    });

    // set the generated table to the new table data
    this.generatedTable = newTableData;

    // initialize isCorrect and isCellFilled arrays for each table separately
    this.isCorrect = new Array(this.generatedTable.length);
    this.isCellFilled = new Array(this.generatedTable.length);
    console.log(this.isCellFilled)
    for (let i = 0; i < this.generatedTable.length; i++) {
      const table = this.generatedTable[i];
      this.isCorrect[i] = new Array(table.rows.length).fill(false);
      this.isCellFilled[i] = new Array(table.rows.length).fill(false);
      console.log(this.isCellFilled)
    }

    // reset isAnswerChecked array for each cell
    for (let i = 0; i < this.tableData.length; i++) {
      for (let j = 0; j < this.tableData[i].rows.length; j++) {
        for (let k = 0; k < this.tableData[i].rows[j].values.length; k++) {
          this.isAnswerChecked[k] = false;
        }
      }
    }
  }


  public clickedCells: { [tableIndex: number]: { rowIndex: number, columnIndex: number, tableIndex: number }[] } = {};


  onCellClick(event: MouseEvent, tableIndex: number, rowIndex: number, columnIndex: number) {
    const clickedCell: { tableIndex: number, rowIndex: number, columnIndex: number } = { tableIndex, rowIndex, columnIndex };

    const clickedCellIndex = this.clickedCells[tableIndex]?.findIndex((cell: { tableIndex: number; rowIndex: number; columnIndex: any; }) => cell.rowIndex === rowIndex && cell.columnIndex === columnIndex);

    if (clickedCellIndex > -1) {
      // Cell is already clicked, remove it from the clickedCells array
      this.clickedCells[tableIndex].splice(clickedCellIndex, 1);
    } else {
      // Cell is not clicked, add it to the clickedCells array
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


  checkAnswers() {
    for (let i = 0; i < this.generatedTable.length; i++) {
      const tableCells = document.querySelectorAll(`.table-cell-${i}`);
      for (let j = 0; j < this.generatedTable[i].rows.length; j++) {
        const rowCells = document.querySelectorAll(`.table-cell-${i}-${j}`);
        for (let k = 0; k < this.generatedTable[i].rows[j].values.length; k++) {
          const expectedAnswer = this.tableData[i].rows[j].values[k];
          const userAnswer = this.generatedTable[i].rows[j].values[k];
          const cell = rowCells[k].querySelector('input') as HTMLInputElement | null;
          if (cell) {
            if (userAnswer !== expectedAnswer) {
              cell.classList.add('incorrect');
            } else {
              cell.classList.add('correct');
            }
          }
        }
      }
    }
  }

}
