import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablegenComponent } from './tablegen.component';

describe('TablegenComponent', () => {
  let component: TablegenComponent;
  let fixture: ComponentFixture<TablegenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TablegenComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablegenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
