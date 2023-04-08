import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GramXComponent } from './gram-x.component';

describe('GramXComponent', () => {
  let component: GramXComponent;
  let fixture: ComponentFixture<GramXComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GramXComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GramXComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
