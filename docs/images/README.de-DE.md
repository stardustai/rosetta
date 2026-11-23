# Hinweise zu den Screenshots

[English](README.md) | [简体中文](README.zh-CN.md) | **Deutsch** | [日本語](README.ja-JP.md)

Die englischen (`*-en.jpg`) und chinesischen (`*-zh.jpg`) Bilder wurden am 18. November 2026 aufgenommen. Die deutschen (`*-de.jpg`) und japanischen (`*-ja.jpg`) Bilder stammen vom 23. November 2026. Alle Aufnahmen zeigen die laufende Anwendung; die Sprache wurde über deren Auswahl geändert. Die Browser-Screenshots wurden nicht nachbearbeitet.

Für Deutsch und Japanisch lief der Arbeitsbereich unter dem eigenen Dokumentations-Origin `http://127.0.0.1:4194`, der echte Annotationsdienst auf Port 4195 und die Konto-API mit einer leeren temporären Datenbank auf Port 4197. Vorhandene Aufgaben und Konten wurden nicht verwendet. Der Editor zeigt den Gastzustand. Es wurden weder Anmelde-E-Mails versendet noch Exporte übertragen oder Speicherverbindungen angelegt.

Die Bildansichten verwenden `public/examples/street.svg`. Für die Importvorschau wurde ein `PublicAnnotationInput`-JSON mit zwei Datensätzen in den Importdialog eingefügt. Die Verweise zeigen per HTTP auf die mitgelieferten `entities.de-DE.txt` beziehungsweise `entities.ja-JP.txt` sowie `street.pcd`. Anschließend wurden die Aufgaben im Dialog erstellt. Die japanische Aufgabenliste filtert mit `サンプル` nach ihren zwei Beispielen.

Die älteren englischen und chinesischen Importansichten verwenden lokale Dateien `entities.txt` und `street.pcd`. Zugangsdaten sind in keiner Sprachfassung zu sehen. Die Exportadresse `https://example.com/api/tasks/{taskId}/annotations` ist ein Beispiel; es wurden keine Daten dorthin gesendet. Die Zugangsdatenfelder im Speicherformular sind leer.

| Datei              | Ansicht                                                         |
| ------------------ | --------------------------------------------------------------- |
| `01-start-*.jpg`   | Startseite und Beispielauswahl                                  |
| `02-import-*.jpg`  | Aufgabenvorschau; Deutsch und Japanisch verwenden JSON-Eingaben |
| `03-tasks-*.jpg`   | Aufgabenliste mit Text- und Punktwolkenbeispielen               |
| `04-tools-*.jpg`   | Bildwerkzeuge und geöffnete Datenvorschau                       |
| `05-editor-*.jpg`  | Bildannotation                                                  |
| `06-export-*.jpg`  | API-Exportkonfiguration                                         |
| `07-storage-*.jpg` | Neue Speicherverbindung ohne Zugangsdaten                       |

Für neue Aufnahmen starten Sie Frontend und Annotationsdienst, folgen der jeweiligen Anleitung und wählen die Sprache. Fotografieren Sie die vollständig geladene Seite. Behalten Sie das Originalbild bei und passen Sie diese Hinweise an, wenn sich Beispiele oder Ablauf ändern.
