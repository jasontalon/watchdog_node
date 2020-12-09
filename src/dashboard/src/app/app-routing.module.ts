import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LatestCaptureComponent } from './pages/views/latest-capture/latest-capture.component';

const routes: Routes = [
  { path: '', component: LatestCaptureComponent },
  // { path: 'second-component', component: SecondComponent },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
