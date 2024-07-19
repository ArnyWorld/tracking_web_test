import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PanelLeftComponent } from './panel-left/panel-left.component';
import { PanelFloatNavComponent } from './panel-float-nav/panel-float-nav.component';
import { PanelRightComponent } from './panel-right/panel-right.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PanelLeftComponent, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'kernotrack_app';
}
