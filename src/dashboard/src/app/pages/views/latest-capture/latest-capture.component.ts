import { Component, OnInit } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';

@Component({
  selector: 'app-latest-capture',
  templateUrl: './latest-capture.component.html',
  styleUrls: ['./latest-capture.component.css']
})
export class LatestCaptureComponent implements OnInit {

  constructor(private apollo: Apollo){}

  ngOnInit(): void {
    this.apollo.subscribe({query: gql`subscription  {
      capture_latest_view {
        camera_id
        captured_at
        classes
        image_name
      }
    }
    `}).subscribe(({data}) => {
      console.log(data);
    });
  }
}
