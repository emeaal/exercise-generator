import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { XgenComponent } from './xgen/xgen.component';
import { GramXComponent } from './gram-x/gram-x.component';

import { UrlCreateComponent } from './url-create/url-create.component';
import { TablegenComponent } from './tablegen/tablegen.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'xgen', component: XgenComponent},
  { path: 'url-create', component: UrlCreateComponent },
  { path: 'tablegen', component: TablegenComponent },
  { path: 'gram-x', component: GramXComponent},
  { path: '**', component: HomeComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
