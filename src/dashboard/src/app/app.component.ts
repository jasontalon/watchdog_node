import { Component } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Subscription } from 'apollo-angular';
import gql from 'graphql-tag';

import {Injectable} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'dashboard';
  private querySubscription: Subscription;
  private cameraChanges: any;

constructor(private apollo: Apollo, private cameraSubscription : CameraChangedSubscription) { }

  ngOnInit(){
    // console.log('aha')
    // this.apollo.subscribe({
    //   query : gql`subscription getCameras {
    //     cameras {
    //       camera_id
    //       camera_name
    //     }
    //   }`
    // }).subscribe(({data}) => {
    //   console.log('asdf', data)

    // });
    // this.apollo.watchQuery({query : gql`query {
    //   cameras {
    //     camera_id
    //     camera_name
    //   }
    // }`}).valueChanges.subscribe(({data, loading} )=> {
    //   console.log(data);
    // });
    // this.cameraChanges = this.cameraSubscription.subscribe().subscribe(({data}) => {

    //   console.log('hxxxey', data)
    // })
  }
}



@Injectable({
  providedIn: 'root',
})
export class CameraChangedSubscription extends Subscription {
  document = gql`
  subscription getCameras {
    cameras {
      camera_id
      camera_name
    }
  }
  `;
}
