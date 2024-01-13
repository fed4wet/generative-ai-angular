import {AfterViewChecked, Component, ElementRef, ErrorHandler, OnInit, ViewChild} from '@angular/core';

import {KatexOptions, MarkdownComponent, MermaidAPI} from 'ngx-markdown';
import {ClipboardButtonComponent} from '../ui-kit/clipboard-button/clipboard-button.component';
import * as uuid from 'uuid';
import {
  ChatSession, EnhancedGenerateContentResponse,
  GenerateContentResult,
  GenerativeModel,
  GoogleGenerativeAI,
  StartChatParams
} from "@google/generative-ai";
import {environment} from '../../environments/environment.development';
import {ChatMessage} from "../types/message-chat.type";
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {NgForOf, NgIf, NgStyle} from "@angular/common";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {ProcessCodeBlocksPipe} from "../pipes/process-code-block.pipe";
import {MermaidService} from "../mermaid/mermaid.service";


@Component({
  selector: 'chat',
  templateUrl: './chat.component.html',
  standalone: true,
  imports: [
    FormsModule,
    MatInputModule,
    ProcessCodeBlocksPipe,
    MatProgressSpinnerModule,
    NgIf,
    MarkdownComponent,
    NgStyle,
    MatIconModule,
    MatButtonModule,
    NgForOf,
    ReactiveFormsModule
  ],
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked, ErrorHandler {
  @ViewChild('bottom') bottom!: ElementRef;
  @ViewChild('scroll') scroll!: ElementRef;
  readonly clipboardButton = ClipboardButtonComponent;
  messages: Array<ChatMessage> = [];
  loading = false;
  katexOptions: KatexOptions = {
    displayMode: true,
    throwOnError: false
  };
  public mermaidOptions: MermaidAPI.Config = {
    fontFamily: `"Source Code Pro", verdana, arial, sans-serif`,
    logLevel: MermaidAPI.LogLevel.Info,
    theme: MermaidAPI.Theme.Default,
    themeCSS: `
        path.arrowMarkerPath { fill: #1d262f; stroke:#1d262f; }
        .node rect { fill: white; stroke:#1d262f; }
        .flowchart-link { stroke: #1d262f; fill: none; }
        .entityBox { fill: white; stroke:#1d262f; }
        .nodeLabel { color: #1d262f; }
        .node polygon { fill: white; stroke:#1d262f; }
        .actor { fill: white; stroke:#1d262f; }
        text.actor>tspan { color: #1d262f; fill:#1d262f; }
        .actor-man circle, line { color: #1d262f; fill:white; stroke:#1d262f; }
      `,
  };
  navigator: any = window.navigator;
  MAX_SIZE_BYTES: number = 20000 - 2700; //request payload approximation 2229 TODO: expose these from the client
  geminiModel: GenerativeModel | undefined;
  chat!: ChatSession;
  input: FormControl<string | null> = new FormControl<string>("");

  constructor(private mermaidService: MermaidService) {
  }

  handleError(error: any): void {
    throw new Error('Method not implemented.');
  }


  ngOnInit(): void {
    this.messages.push({
      id: uuid.v4(),
      text: this.mermaidService.diagrams,
      sender: '@fed4wet',
      avatar: "https://media.licdn.com/dms/image/D4D03AQG5DE3yJNcNPA/profile-displayphoto-shrink_800_800/0/1676575729872?e=1710374400&v=beta&t=rnJdhNttPWGa29hGpO3bWtCUCF_GUcONYg3IJ3chmyc",
    });

    // Gemini Client
    const genAI: GoogleGenerativeAI = new GoogleGenerativeAI(environment.API_KEY);
    this.geminiModel = genAI.getGenerativeModel({model: "gemini-pro"});

    this.chat = this.geminiModel.startChat({
      history: [
        {
          role: "user",
          parts: "Keep your answers brief and to a single paragraph. Use markdown formatting extensively, Katex for formulas and MermaidJS for diagrams. Do not use other formats. Always specify the language in code fences. Eg: ```HTML. Try to use at least one or more of these special formatting options when providing your answers. Pay special attention to indentation when using MermaidJS and be very conservative using features to avoid syntax errors. Reply understood if you got everything.",
        },
        {
          role: "model",
          parts: "Understood.",
        },
        {
          role: "user",
          parts: "Difference between Constructor and ngOnInit? Answer: The constructor is called when an **Angular component** is created, while `ngOnInit` is called after the component's data has been initialized. This means that the constructor can be used to initialize the component's properties, while `ngOnInit` can be used to perform any additional initialization that needs to be done after the component's data has been loaded.\n\nFor example, the constructor might be used to set the initial value of a component's property, while `ngOnInit` might be used to subscribe to an observable or call a service.\n\nHere is an example of a constructor:\n\n```ts\nconstructor(private service: MyService) {}\n```\nAnd here is an example of `ngOnInit`:\n\n```ts\nngOnInit() {\n  this.service.getData().subscribe(data => {\n    this.data = data;\n  });\n}\n```\nIn this example, the constructor is used to inject the `MyService` dependency, while `ngOnInit` is used to subscribe to the `getData` observable and update the component's data property with the data that is returned.",
        },
        {
          role: "model",
          parts: "The constructor is called when an **Angular component** is created, while `ngOnInit` is called after the component's data has been initialized. This means that the constructor can be used to initialize the component's properties, while `ngOnInit` can be used to perform any additional initialization that needs to be done after the component's data has been loaded.\n\nFor example, the constructor might be used to set the initial value of a component's property, while `ngOnInit` might be used to subscribe to an observable or call a service.\n\nHere is an example of a constructor:\n\n```ts\nconstructor(private service: MyService) {}\n```\nAnd here is an example of `ngOnInit`:\n\n```ts\nngOnInit() {\n  this.service.getData().subscribe(data => {\n    this.data = data;\n  });\n}\n```\nIn this example, the constructor is used to inject the `MyService` dependency, while `ngOnInit` is used to subscribe to the `getData` observable and update the component's data property with the data that is returned.",
        },
        {
          role: "user",
          parts: "Summarise Google's Generative AI using a mind map with MermaidJS.",
        },
        {
          role: "model",
          parts: `
          \`\`\`mermaid
          mindmap
          {{Google Generative AI}}
            VertexAI
            ::icon(fa fa-cloud)
             (Text)
             ::icon(fa fa-file-alt)
             (Code)
             ::icon(fa fa-code)
             (Audio)
             ::icon(fa fa-volume-up)
             (Images)
             ::icon(fa fa-image)
            MakerSuite
            ::icon(fa fa-edit)
             [Gemini for Text]
             ::icon(fa fa-file-alt)
             [Gemini for Chat]
             ::icon(fa fa-comments)
             [Embeddings]
             ::icon(fa fa-tasks)
          \`\`\``,
        }
      ],
      generationConfig: {
        temperature: 0,
        top_p: 1,
        top_k: 1,
        max_output_tokens: 2048,
      },
    } as StartChatParams);
  }

  handleUserMessage(event: any): void {
    if (!this.input.value?.trim()) {
      event?.preventDefault();
      return;
    }

    this.sendMessage(this.input.value);
    this.input.setValue('');

  }

  public async sendMessage(text: string): Promise<void> {
    const processedText = this.processText(text);
    this.addMessage(processedText);
    await this.sendMessageAndHandleResponse(text);
  }

  private processText(text: string): string {
    return text.split(/(```[^`]+```)/)
      .map((section, index) => index % 2 === 0 ? section.replace(/\n/g, "<br>") : section)
      .join('');
  }

  private addMessage(processedText: string): void {
    this.messages.push({
      id: uuid.v4(),
      text: processedText,
      sender: '@fed4wet',
      avatar: "your-avatar-url",
    });
    this.scrollToBottom();
  }

  private async sendMessageAndHandleResponse(text: string): Promise<void> {
    this.loading = true;
    try {
      const result: GenerateContentResult = await this.chat.sendMessage(this.trimStringToByteLimit(text));
      const response: EnhancedGenerateContentResponse = await result.response;
      if (response) {
        this.addBotMessage(response.text());
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }


  private addBotMessage(text: string): void {
    this.messages.push({
      id: uuid.v4(),
      text: text,
      sender: 'Bot',
      avatar: "/assets/gemini.svg",
    });
  }


  private scrollToBottom(): void {
    requestAnimationFrame((): void => {
      this.scroll.nativeElement.scrollTop = this.bottom.nativeElement.offsetTop;
    });
  }


  retry(text: string): void {
    if (this.isUserMessage(text)) {
      this.sendMessage(text);
    }
  }

  isUserMessage(text: string) {
    //find original message
    const message: ChatMessage | undefined = this.messages.find((message: any) => message.text === text);
    return (message && message.sender /* user message */);
  }

  showReply(text: string) {
    // only if it is a user prompt (it has a sender)
    return this.messages.find((message: any) => message.text === text && message.sender);
  }

  trackByFn(i: number, element: any) {
    return element.id;
  }

  delete(id: string) {
    this.messages = this.messages.filter((message: any) => message.id !== id);
  }

  ngAfterViewChecked() {
    //fix odd issue with mermaidjs icons: class="node-icon-0 fa&nbspfa-edit"
    document.querySelectorAll("[class^=node-icon-]").forEach(elem => {
      let classSanitised = elem.className.replace(/\s/g, ' ');
      elem.className = classSanitised;
    })
  }

  trimStringToByteLimit(text: string, maxSize: number = this.MAX_SIZE_BYTES): string {
    if (maxSize < 1) throw new Error("Invalid maxSize");

    const marker = "...";
    const markerSize: number = new TextEncoder().encode(marker).length;
    maxSize = Math.min(maxSize, this.MAX_SIZE_BYTES);

    const byteEncoder: TextEncoder = new TextEncoder();
    const inputBytes: Uint8Array = byteEncoder.encode(text);

    if (inputBytes.length <= maxSize) {
      return text;
    }

    const remainingBytes: number = maxSize - markerSize;
    const trimmedBytes: Uint8Array = inputBytes.slice(0, remainingBytes);
    console.log("Warning. Message was trimmed to fit max capacity: ", maxSize);

    return new TextDecoder().decode(trimmedBytes) + marker;
  }


}

window.document.addEventListener('copy', function (event): void {
  const selection = window.getSelection();
  if (selection?.isCollapsed) {
    return;  // default action OK
  }
  const fragment = selection?.getRangeAt(0).cloneContents();
  const katexs = fragment?.querySelectorAll('.katex');
  if (katexs?.length === 0) {
    return;  // default action OK
  }
  katexs?.forEach(function (element) {
    const texSource = element.querySelector('annotation');
    if (texSource) {
      element.replaceWith(texSource);
      texSource.innerHTML = '$' + texSource.innerHTML + '$';
    }
  });
  fragment?.querySelectorAll('.katex-display annotation').forEach(function (element) {
    element.innerHTML = '$' + element.innerHTML + '$';
  })
  event?.clipboardData?.setData('text/plain', fragment?.textContent || "");
  event?.clipboardData?.setData('text/html', selection?.getRangeAt(0).cloneContents().textContent || "");
  event.preventDefault();
})
