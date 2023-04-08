import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XgenComponent } from './xgen.component';

describe('XgenComponent', () => {
  let component: XgenComponent;
  let fixture: ComponentFixture<XgenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ XgenComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XgenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
