import {Injectable} from '@angular/core';
import {MermaidAPI} from "ngx-markdown";

@Injectable({
  providedIn: 'root'
})
export class MermaidService {
  public diagrams: string = `

        **MermaidJS for diagrams**
          \`\`\`mermaid
    graph TD
    AI("Artificial Intelligence")
    AI --> ML("Machine Learning")
    ML --> SL("Supervised Learning")
    ML --> UL("Unsupervised Learning")
    ML --> RL("Reinforcement Learning")
    ML --> DL("Deep Learning")
    DL --> CNN("Convolutional Neural Networks")
    DL --> RNN("Recurrent Neural Networks")
    DL --> T("Transformers")
    AI --> CAI("Classical AI")
    CAI --> ES("Expert Systems")
    CAI --> SymAI("Symbolic AI")
    AI --> GAI("Generative AI")
    GAI --> GANs("GANs")
    GAI --> VAE("Variational Autoencoders")
    GAI --> TGM("Text Generation Models")
    GAI --> OGM("Other Generative Models")
    AI --> DMAI("Discriminative Models AI")
    DMAI --> IC("Image Classification")
    DMAI --> NLP("Natural Language Processing")
    DMAI --> OCT("Other Classification Tasks")
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
