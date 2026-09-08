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
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.8rem, 5.4vw, 5rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
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
  button-dark:
    backgroundColor: "{colors.chocolate}"
    textColor: "{colors.cream}"
    rounded: "{rounded.control}"
    padding: "14px 24px"
    height: "52px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.chocolate}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
    height: "49px"
---

# Design System: Snackyzz

## Overview

**Creative North Star: "The Confectionery Campaign"**

Snackyzz feels like a confident food campaign translated into a practical store. Oversized editorial type, honest cookie photography, warm paper surfaces, and a sharp orange accent make the product desirable without slowing down cart, checkout, or order review.

Dense operational screens reduce the display scale while retaining the same palette, typography, and tactile controls. The system stays warm, direct, and legible across phone, tablet, and desktop.

**Key Characteristics:**

- Cream canvas with chocolate structure and decisive orange actions.
- Rounded editorial display type paired with quiet sans-serif controls.
- Large product photography and compact, factual supporting copy.
- Flat tonal layering; shadows appear only for temporary floating feedback.

## Colors

Orange creates appetite and action; cream and chocolate carry almost every structural surface.

### Primary

- **Snackyzz Orange:** Calls to action, campaign bands, and key brand punctuation.
- **Deep Orange:** Emphasis inside display headlines and focused states.

### Secondary

- **Chocolate:** Primary text, navigation controls, dark promotional fields, and administrative actions.

### Neutral

- **Cream:** Global canvas.
- **Paper:** Forms, carts, order detail, and other working surfaces.
- **Muted Brown:** Secondary copy and helper text.
- **Warm Line:** Dividers and control outlines.
- **Cream Tint:** Quiet section and selected-state layering.

**The Orange Has a Job Rule.** Use orange for appetite, action, or brand cadence; never scatter it as decoration.

## Typography

**Display Font:** Fraunces with Georgia fallback

**Body Font:** DM Sans with sans-serif fallback

**Character:** Fraunces makes the brand feel edible and editorial. DM Sans keeps prices, forms, order states, and instructions easy to scan.

### Hierarchy

- **Display:** Bold, tightly tracked, balanced headlines; fluid sizing with a six-rem ceiling.
- **Headline:** Bold section and workflow titles with compact leading.
- **Title:** Product names and panel headings, usually 21–30px.
- **Body:** 16px base, 1.6 line height, with supporting copy capped at 70 characters.
- **Label:** 10–14px, medium or bold, used for controls, prices, and states.

**The Two Voices Rule.** Fraunces speaks for products and moments; DM Sans handles every instruction and operation.

## Layout

The main container is capped at 1240px with generous desktop gutters. Marketing areas use asymmetrical two-column compositions; product lists use three columns, then one. Shop and checkout pair the primary task with a sticky order summary.

At 800px navigation compacts and working layouts tighten. At 560px every essential flow becomes one column, the checkout summary moves before the form, admin detail moves before its list, and touch controls retain usable height. Horizontal overflow is never acceptable.

## Elevation & Depth

The system is flat by default. Cream, paper, tint, thin warm dividers, photography, and overlap establish hierarchy. Only transient toasts use a soft ambient shadow.

**The Tonal Depth Rule.** Prefer a change in warm surface tone before adding a border or shadow.

## Shapes

Working surfaces use gently curved 12px corners. Buttons and inputs use tighter 6–7px corners. Small counters, status chips, and the brand seal are fully rounded. The hero image carries a tall confectionery arch; repeat it only for campaign-scale imagery.

## Components

### Buttons

- **Shape:** Compact rounded rectangle with at least 52px primary height.
- **Primary:** Orange with chocolate text; dark actions invert to chocolate and cream.
- **Hover / Focus:** Small upward movement and a strong deep-orange focus outline.
- **Secondary:** Transparent with a one-pixel chocolate outline.

### Chips

- **Style:** Fully rounded, compact, and quiet at rest.
- **State:** Selected filters invert to chocolate and cream; order states use restrained semantic tints.

### Cards / Containers

- **Corner Style:** 12px for carts, forms, dialogs, and order panels.
- **Background:** Paper over cream; promotional fields may use chocolate.
- **Shadow Strategy:** Flat by default.
- **Border:** Use a warm divider only where adjacent content needs structure.

### Inputs / Fields

- **Style:** Paper background, warm one-pixel outline, 7px corners.
- **Focus:** Visible deep-orange outline with spacing around the field.
- **Error / Disabled:** Errors use a warm red tint and actionable text; disabled controls remain legible.

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

### Don't:

- **Don't** introduce cool grays, blue SaaS accents, glass effects, or generic dashboard gradients.
- **Don't** invent product, ingredient, payment, or location claims.
- **Don't** hide order totals, confirmation state, or recovery actions inside decorative UI.
- **Don't** replace the display/body type relationship with a single system font.
