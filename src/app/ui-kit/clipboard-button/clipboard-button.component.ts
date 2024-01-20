import {Component} from '@angular/core';
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";

@Component({
  selector: 'app-clipboard-button',
  templateUrl: './clipboard-button.component.html',
  styleUrls: ['./clipboard-button.component.scss'],
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule
  ]
})
export class ClipboardButtonComponent {
}
