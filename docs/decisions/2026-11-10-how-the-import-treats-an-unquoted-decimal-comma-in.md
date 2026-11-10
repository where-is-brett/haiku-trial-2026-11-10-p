<!-- docs/decisions/2026-11-10-how-the-import-treats-an-unquoted-decimal-comma-in.md -->
# How the import treats an unquoted decimal comma in an amount, such as 12,50

- **Date:** 10 November 2026
- **Piece:** bank-statement-import
- **Options:** A. Refuse the whole file when an unquoted amount has a comma followed by two digits; the user quotes the amount or uses a dot (Some comma-decimal exports are refused until they are quoted; small change; Can be undone) · B. Read a comma followed by two digits as the decimal point, so 12,50 is 12.50 (A rule per bank format; can misread thousands separators; medium change; Can be partly undone) · C. Leave it as it is; a comma-decimal statement can store the wrong cents (No work now; wrong money can be stored; Cannot be undone)
- **Recommended:** refuse
- **Chosen:** refuse
- **The director's words:** none
