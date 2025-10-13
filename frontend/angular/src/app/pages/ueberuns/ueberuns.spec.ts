import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UeberunsComponent } from './ueberuns';

describe('UeberunsComponent', () => {
  let component: UeberunsComponent;
  let fixture: ComponentFixture<UeberunsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UeberunsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UeberunsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
