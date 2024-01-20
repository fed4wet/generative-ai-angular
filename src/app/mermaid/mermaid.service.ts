import {Injectable} from '@angular/core';
import {MermaidAPI} from "ngx-markdown";

@Injectable({
  providedIn: 'root'
})
export class MermaidService {
  public diagrams: string = `
        **MermaidJS for diagrams**
          \`\`\`mermaid
          sequenceDiagram
          Alice->>+John: Hello John, how are you?
          Alice->>+John: John, can you hear me?
          John-->>-Alice: Hi Alice, I can hear you!
          John-->>-Alice: I feel great!
          \`\`\`

          \`\`\`mermaid
            flowchart TD
            A[Christmas] -->|Get money| B(Go shopping)
            B --> C{Let me think}
            C -->|One| D[Laptop]
            C -->|Two| E[iPhone]
            C -->|Three| F[fa:fa-car Car]
          \`\`\`

          \`\`\`mermaid
          classDiagram
          Animal <|-- Duck
          Animal <|-- Fish
          Animal <|-- Zebra
          Animal : +int age
          Animal : +String gender
          Animal: +isMammal()
          Animal: +mate()
          class Duck{
            +String beakColor
            +swim()
            +quack()
          }
          class Fish{
            -int sizeInFeet
            -canEat()
          }
          class Zebra{
            +bool is_wild
            +run()
          }
          \`\`\`

          \`\`\`mermaid
          stateDiagram-v2
          [*] --> Still
          Still --> [*]
          Still --> Moving
          Moving --> Still
          Moving --> Crash
          Crash --> [*]
          \`\`\`

          \`\`\`mermaid
          erDiagram
          CUSTOMER }|..|{ DELIVERY-ADDRESS : has
          CUSTOMER ||--o{ ORDER : places
          CUSTOMER ||--o{ INVOICE : "liable for"
          DELIVERY-ADDRESS ||--o{ ORDER : receives
          INVOICE ||--|{ ORDER : covers
          \`\`\`

          \`\`\`mermaid
          gantt
          title A Gantt Diagram
          dateFormat  YYYY-MM-DD
          section Section
          A task           :a1, 2014-01-01, 30d
          Another task     :after a1  , 20d
          section Another
          Task in sec      :2014-01-12  , 12d
          another task      : 24d
          \`\`\`

          \`\`\`mermaid
          gitGraph
          commit
          commit
          branch develop
          checkout develop
          commit
          commit
          checkout main
          merge develop
          commit
          commit
          \`\`\`

          \`\`\`mermaid
          pie title Pets adopted by volunteers
          "Dogs" : 386
          "Cats" : 85
          "Rats" : 15
          \`\`\`

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
          \`\`\`

          \`\`\`mermaid
          quadrantChart
          Campaign A: [0.3, 0.6]
          Campaign B: [0.45, 0.23]
          Campaign C: [0.57, 0.69]
          Campaign D: [0.78, 0.34]
          Campaign E: [0.40, 0.34]
          Campaign F: [0.35, 0.78]
          \`\`\`
        `
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
}
