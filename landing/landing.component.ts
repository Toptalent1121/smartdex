import { Component, OnInit, AfterViewChecked  } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  private fragment: string;
  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.fragment.subscribe(f => {
      const element = document.querySelector('#' + f);
      if (element) {
          element.scrollIntoView(); // <-- omit element from the argument
      }

    });
  }
}
