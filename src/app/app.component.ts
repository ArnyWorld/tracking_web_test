import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PanelLeftComponent } from './panel-left/panel-left.component';
import { PanelFloatNavComponent } from './panel-float-nav/panel-float-nav.component';
import { PanelRightComponent } from './panel-right/panel-right.component';

declare var controllerMaps: any;
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule,PanelLeftComponent, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit  {
  title = 'kernotrack_app';
  showpanel="";
  constructor(private route: ActivatedRoute) { }
  ngOnInit(): void {
	this.showpanel = this.route.snapshot.paramMap.get('showpanel');
	console.log("showpanel",this.showpanel);
  }
}
