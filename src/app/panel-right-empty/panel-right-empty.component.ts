import { Component, Input, OnInit, input } from '@angular/core';

@Component({
  selector: 'app-panel-right-empty',
  templateUrl: './panel-right-empty.component.html',
  styleUrl: './panel-right-empty.component.css'
})
export class PanelRightEmptyComponent implements OnInit {
	@Input() selected:string = "Dispositivos";
	@Input() tabs?:any;
	
	ngOnInit(): void {
		console.log("tabs",this.tabs);
	}
}
