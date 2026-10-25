---
name: Snackyzz
description: A warm confectionery campaign built for small breaks and strong cravings.
colors:
  snackyzz-orange: "#ED781A"
  deep-orange: "#D95907"
  chocolate: "#3C1907"
  cream: "#F9EDE0"
  paper: "#FFF9F2"
  muted-brown: "#795541"
  warm-line: "#DCC6B2"
  cream-tint: "#EFDDCA"
  warm-red: "#A8321C"
  leaf: "#3F5A1C"
  honey: "#7F4A00"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.8rem, 5.4vw, 5rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  wordmark:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.375
rounded:
  control: "7px"
  surface: "12px"
  round: "30px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "40px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.snackyzz-orange}"
    textColor: "{colors.chocolate}"
    rounded: "{rounded.control}"
    padding: "14px 24px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.deep-orange}"
  button-dark:
    backgroundColor: "{colors.chocolate}"
    textColor: "{colors.cream}"
    rounded: "{rounded.control}"
    padding: "14px 24px"
    height: "52px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.chocolate}"
    rounded: "{rounded.control}"
    padding: "14px 24px"
    height: "52px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.chocolate}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
    height: "49px"
  checkbox:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.control}"
    size: "24px"
  checkbox-checked:
    backgroundColor: "{colors.chocolate}"
    textColor: "{colors.cream}"
  chip-neutral:
    backgroundColor: "{colors.cream-tint}"
    textColor: "{colors.chocolate}"
    rounded: "{rounded.round}"
    padding: "4px 10px"
  chip-selected:
    backgroundColor: "{colors.chocolate}"
    textColor: "{colors.cream}"
    rounded: "{rounded.round}"
    padding: "4px 10px"
  chip-pending:
    backgroundColor: "#7F4A0026"
    textColor: "{colors.honey}"
    rounded: "{rounded.round}"
    padding: "4px 10px"
  chip-positive:
    backgroundColor: "#3F5A1C26"
    textColor: "{colors.leaf}"
    rounded: "{rounded.round}"
    padding: "4px 10px"
  chip-negative:
    backgroundColor: "#A8321C26"
    textColor: "{colors.warm-red}"
    rounded: "{rounded.round}"
    padding: "4px 10px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.chocolate}"
    rounded: "{rounded.surface}"
    padding: "24px"
  dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.chocolate}"
    rounded: "{rounded.surface}"
    padding: "24px"
  toast:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.chocolate}"
    rounded: "{rounded.surface}"
    padding: "16px"
---

# Design System: Snackyzz

## Overview

**Creative North Star: "The Confectionery Campaign"**

Snackyzz feels like a confident food campaign translated into a practical store. Oversized editorial type, honest cookie photography, warm paper surfaces, and a sharp orange accent make the product desirable without slowing down cart, checkout, or order review.

Dense operational screens reduce the display scale while retaining the same palette, typography, and tactile controls. The system stays warm, direct, and legible across phone, tablet, and desktop.

The rebuild keeps this design as it ships today on `main` (G-09). Where this file is silent, the screens on `main` are the reference; see `docs/rebuild/05-ui-parity.md`.

**Key Characteristics:**

- Cream canvas with chocolate structure and decisive orange actions.
- Rounded editorial display type paired with quiet sans-serif controls.
- Large product photography and compact, factual supporting copy.
- Flat tonal layering; shadows appear only for temporary floating feedback.

## Colors

Orange creates appetite and action; cream and chocolate carry almost every structural surface.

### Primary

- **Snackyzz Orange:** Calls to action, campaign bands, brand chips, and key brand punctuation.
- **Deep Orange:** Primary-button hover, emphasis inside display headlines, and every focus outline (3.4:1 on cream).

### Secondary

- **Chocolate:** Primary text, navigation controls, dark promotional fields, administrative actions, checked checkboxes and radios, and selected chips.

### Neutral

- **Cream:** Global canvas.
- **Paper:** Forms, carts, order detail, dialogs, sheets, menus, toasts, and other working surfaces.
- **Muted Brown:** Secondary copy, helper text, table headers, and the outline of unchecked checkboxes and radios (6.3:1 on paper).
- **Warm Line:** Dividers, table rows, and text-field outlines.
- **Cream Tint:** Quiet section and selected-state layering, menu highlights, neutral chips, and disabled fields.

### Status

- **Warm Red:** Errors, rejected and cancelled states, destructive actions.
- **Leaf:** Confirmed and completed states.
- **Honey:** States waiting on someone, such as pending review.

**The Orange Has a Job Rule.** Use orange for appetite, action, or brand cadence; never scatter it as decoration.

**The Tint-and-Ink Rule.** A status color appears as text on a 15% tint of itself, never as white text on a solid fill. Each pairing keeps 4.5:1 on both paper and cream.

**The Three-to-One Outline Rule.** A control whose outline is its only cue (an unchecked checkbox or radio) takes Muted Brown. Warm Line (1.57:1 on paper) only outlines fields that already carry a visible label.

## Typography

**Display Font:** Fraunces with Georgia fallback

**Body Font:** DM Sans with sans-serif fallback

**Character:** Fraunces makes the brand feel edible and editorial. DM Sans keeps prices, forms, order states, and instructions easy to scan.

### Hierarchy

- **Display:** Bold, tightly tracked, balanced headlines; fluid sizing with a five-rem ceiling.
- **Wordmark:** Lowercase "snackyzz" in extra-bold Fraunces at 44px (36px on phones), tracked to -0.04em, closed by a Deep Orange period.
- **Headline:** Bold Fraunces section and workflow titles (30px) with compact leading.
- **Title:** Product names and the headings of cards, dialogs, and sheets: Fraunces bold at 24px.
- **Body:** 16px base, 1.6 line height, with supporting copy capped at 70 characters. Inputs, selects, and menu items stay at 16px on every width, so phones never zoom into a field.
- **Label:** 14px medium for field labels, table cells, and descriptions; 12px semibold for chips and table headers.

**The Two Voices Rule.** Fraunces speaks for products and moments; DM Sans handles every instruction and operation.

## Layout

The main container is capped at 1240px with generous desktop gutters. Marketing areas use asymmetrical two-column compositions; product lists use three columns, then one. Shop and checkout pair the primary task with a sticky order summary.

At 800px navigation compacts and working layouts tighten. At 560px every essential flow becomes one column, the checkout summary moves before the form, admin detail moves before its list, card padding tightens from 24px to 16px, and side sheets take the full width. Touch controls keep usable height: 52px buttons, 49px fields, 40px menu items, and 24px checkboxes and radios.

Fields stack with 8px between a label and its control and 24px between fields. Dialog actions stack on phones with the primary action on top.

**The No Sideways Scroll Rule.** Horizontal overflow is never acceptable on the page. Wide tables scroll inside their own container instead.

## Elevation & Depth

The system is flat by default. Cream, paper, tint, thin warm dividers, photography, and overlap establish hierarchy. Cards, dialogs, sheets, and select menus carry no shadow: dialogs and sheets separate from the page with a chocolate overlay at 40%, and menus with a warm-line border. Only transient toasts use a soft ambient shadow, tinted with chocolate rather than black.

### Shadow Vocabulary

- **Float** (`box-shadow: 0 12px 32px -12px rgb(60 25 7 / 0.32)`): toasts only.

**The Tonal Depth Rule.** Prefer a change in warm surface tone before adding a border or shadow.

**The Only Toasts Float Rule.** If it isn't temporary feedback that leaves on its own, it doesn't get a shadow.

## Shapes

Working surfaces (cards, dialogs, toasts, choice cards) use gently curved 12px corners; a bottom sheet rounds only its top edge. Buttons, inputs, selects, menus, and checkboxes use tighter 7px corners. Small counters, status chips, radios, and the brand seal are fully rounded. The hero image carries a tall confectionery arch; repeat it only for campaign-scale imagery.

## Components

### Buttons

- **Shape:** Compact rounded rectangle (7px) with a 52px default height and 16px medium label; the small size is 40px.
- **Primary:** Orange with chocolate text, deepening to Deep Orange on hover; dark actions invert to chocolate and cream.
- **Hover / Focus:** A 1px upward lift and a 2px deep-orange focus outline offset 2px.
- **Secondary:** Transparent with a one-pixel chocolate outline. Ghost buttons gain a cream-tint wash on hover. Destructive actions are warm red with paper text.

### Chips

- **Style:** Fully rounded, compact (12px semibold, 4px × 10px padding), and quiet at rest.
- **State:** Neutral chips sit on cream tint; brand chips are orange; selected filters invert to chocolate and cream. Order states use the Tint-and-Ink tones: honey for waiting, leaf for confirmed, warm red for rejected or cancelled, neutral for done. Each feature maps its own states to these tones.

### Cards / Containers

- **Corner Style:** 12px for carts, forms, dialogs, and order panels.
- **Background:** Paper over cream; promotional fields may use chocolate with cream text.
- **Shadow Strategy:** Flat, with no border by default.
- **Border:** Use a warm divider only where adjacent content needs structure.
- **Internal Padding:** 24px, tightening to 16px on phones; the title is set in Fraunces.

### Inputs / Fields

- **Style:** Paper background, warm one-pixel outline, 7px corners, 49px tall, 12px × 14px padding. Selects share the same trigger; text areas start at 112px and grow with their content.
- **Focus:** A visible 2px deep-orange outline with 2px of space around the field.
- **Error / Disabled:** Errors switch the outline to warm red over a faint warm-red wash, with actionable warm-red text below. Disabled fields fill with cream tint and muted-brown text so they stay legible.

### Checkboxes and Radios

- **Style:** 24px paper controls with a muted-brown outline; checkboxes take 7px corners, radios are round.
- **Checked:** Checkboxes fill chocolate with a cream tick; radios take a 2px chocolate ring with a chocolate dot.
- **Choice cards:** A label can wrap a whole option as a paper card with a warm-line border; the selected card layers on cream tint with a chocolate outline.

### Menus

- **Style:** Select menus open below their trigger on paper with a warm-line border and 7px corners, no shadow.
- **Items:** 40px rows in 16px text; the highlighted row takes cream tint and the selected one a chocolate check.

### Dialogs and Sheets

- **Style:** Paper panels over a 40% chocolate overlay. Dialogs are centered, at most 512px wide, inset 16px from the viewport, and scroll inside when tall. Side sheets are 384px wide from 560px up and full width below; bottom sheets round their top corners.
- **Content:** A Fraunces title, muted-brown description, and an icon close button in the corner whenever the screen supplies its label.

### Toasts

- **Style:** Paper with a warm-line border, 12px corners, 16px padding, and the Float shadow.
- **Content:** A 14px semibold message with an optional muted-brown description. The icon takes the status ink (leaf, honey, warm red), and an action renders as a small dark button.

### Tables

- **Style:** 14px rows divided by warm lines, with 12px cell padding and 12px semibold muted-brown headers.
- **State:** Hovered rows take a light cream-tint wash; selected rows take full cream tint.

### Navigation

The chocolate wordmark anchors a cream header. Desktop links use a short transform-based underline. Mobile keeps cart access visible and reveals a simple vertical menu.

### Product Photography

Cookie images are close, tactile studio photographs on cream or orange grounds. They are explicitly described as reference images until real product photography replaces them.

## Do's and Don'ts

### Do:

- **Do** keep checkout status language precise: received, pending review, confirmed.
- **Do** give cookie photography enough scale to carry appetite and recognition.
- **Do** preserve the four committed brand colors throughout new screens.
- **Do** stack operational layouts intentionally on small screens.
- **Do** pair every status tint with its own ink color (honey on honey, leaf on leaf, warm red on warm red).
- **Do** give every field a visible label; the warm-line outline relies on it.

### Don't:

- **Don't** introduce cool grays, blue SaaS accents, glass effects, or generic dashboard gradients.
- **Don't** invent product, ingredient, payment, or location claims.
- **Don't** hide order totals, confirmation state, or recovery actions inside decorative UI.
- **Don't** replace the display/body type relationship with a single system font.
- **Don't** put shadows on cards, dialogs, sheets, or menus; only toasts float.
- **Don't** dim overlays with black; use chocolate.
