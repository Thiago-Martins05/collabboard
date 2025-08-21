# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - img "CollabBoard Logo" [ref=e7]
        - heading "CollabBoard" [level=1] [ref=e8]
        - paragraph [ref=e9]: Kanban colaborativo para equipes
      - generic [ref=e10]:
        - generic [ref=e11]:
          - heading "Bem-vindo de volta" [level=2] [ref=e12]
          - paragraph [ref=e13]: Entre com sua conta para continuar
        - generic [ref=e14]:
          - generic [ref=e15]:
            - textbox "seu-email@exemplo.com" [ref=e16]
            - textbox "Seu nome (opcional)" [ref=e17]
          - button "Entrar com Email" [ref=e18]:
            - img
            - text: Entrar com Email
        - generic [ref=e23]: Ou continue com
        - generic [ref=e24]:
          - button "Continuar com GitHub" [ref=e25]:
            - img
            - text: Continuar com GitHub
          - button "Continuar com Google" [ref=e26]:
            - img
            - text: Continuar com Google
        - paragraph [ref=e28]:
          - text: Problemas para entrar?
          - link "Entre em contato" [ref=e29] [cursor=pointer]:
            - /url: /
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e35] [cursor=pointer]:
    - img [ref=e36] [cursor=pointer]
  - alert [ref=e39]
```