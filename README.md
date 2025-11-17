# Payload CMS Backend Developer Challenge: Meal Planner

Thank you for your interest in this role. This challenge is designed to assess your skills in backend development, data modeling, problem-solving, and your ability to customize the **Payload CMS Admin Panel** to build a complete, practical solution.

## 1\. The Problem

### The Current Manual Workflow

In a busy elderly care home, the meal ordering process is entirely manual and paper-based.

**The Caregiver's Daily Routine:**
Every day, three times a day (breakfast, lunch, dinner), a caregiver walks from room to room with a stack of pre-printed paper forms. They ask each resident for their meal preferences and mark the choices on paper. These forms are then collected and delivered to the kitchen.

**The Kitchen Staff's Daily Routine:**
The kitchen staff receives all the collected paper forms. Their workflow involves:
  * **Reading each individual form** to understand what needs to be prepared for each resident
  * **Manually tallying all ingredients** across all forms (e.g., "82 bread rolls, 65 portions of butter...") to know what quantities are needed for the next day
  * **Checking off each form** one by one as they prepare individual meal trays
  * **Discarding the forms** after the meal is served

### The Original Paper Forms

![Breakfast Form](/docs/breakfast-form.jpeg)
*Figure 1: Original paper form for Breakfast orders*

![Lunch Form](/docs/lunch-form.jpeg)
*Figure 2: Original paper form for Lunch orders*

![Dinner Form](/docs/dinner-form.jpeg)
*Figure 3: Original paper form for Dinner orders*

### Pain Points of the Manual System

  * **Error-prone:** Papers can be lost, misread, or damaged
  * **Time-consuming:** Manual counting and tallying is slow
  * **No historical data:** Once a meal is served, there's no record for analytics or planning
  * **Inefficient:** Kitchen staff must handle each paper multiple times
  * **No visibility:** No way to track what's been prepared vs. what's pending

## 2\. Your Challenge

**Your task is to digitize this entire workflow using Payload CMS.**

You need to design and build a solution that:
  * Allows caregivers to efficiently capture meal preferences digitally
  * Enables kitchen staff to see aggregated ingredient needs for meal planning
  * Provides a way to track meal preparation progress
  * Maintains historical data for analytics and reporting
  * Implements proper access control for different user roles

## 3\. Required User Roles & Access Control

Your solution must support three distinct user roles with appropriate access control:

  * **Admin:** Full system access
  * **Caregiver:** Needs to capture meal preferences from residents
  * **Kitchen:** Needs to view meal orders, plan ingredients, and track meal preparation

**You must design and implement the appropriate access control for each role.** Consider:
  * What data should each role be able to create, read, update, or delete?
  * Are there specific fields that should be read-only for certain roles?
  * What parts of the admin interface should each role have access to?

## 4\. Core Requirements

Your solution must address the following key requirements:

### A. Data Model

You need to design a data model that captures all the information from the paper forms (see figures above). At minimum, your model should support:

  * **Resident information** (permanent data like name, room number, dietary restrictions, etc.)
  * **Meal orders** with:
      * Date and meal type (Breakfast, Lunch, Dinner)
      * All the meal-specific options shown in the paper forms
      * Order status tracking (e.g., pending vs. prepared)
      * Any special dietary notes or preferences

**Note:** The paper forms show different fields for each meal type. Your data model should reflect this.

### B. Caregiver Workflow

Caregivers need an efficient way to:
  * Select a resident
  * Choose the date and meal type
  * Quickly enter meal preferences based on the resident's choices
  * Submit the order

The interface should be optimized for speed and ease of use on a tablet.

### C. Kitchen Workflow

Kitchen staff need to:
  * **View aggregated ingredient needs:** Select a date and meal type to see a summary of all ingredients needed (e.g., "82 bread rolls, 65 portions of butter")
  * **Access detailed order information:** See individual resident orders for meal preparation
  * **Track preparation progress:** Mark orders as prepared/completed
  * **Historical data:** Be able to review past orders for analytics and planning

### D. Kitchen Dashboard

You must create a custom page in the Payload Admin UI where kitchen staff can:
  * Select a date and meal type
  * Generate a report showing aggregated ingredient quantities
  * The report can be displayed as JSON or in a more user-friendly format

## 5\. Technical Constraints

  * **Platform:** Must be built using **Payload CMS**
  * **Database:** Must use **PostgreSQL** database adapter (`@payloadcms/db-postgres`)
  * **Seeding:** Must include a seed script that runs on `onInit` (in `payload.config.ts`) to populate test data
  * **Authentication:** Use Payload's built-in authentication system with the three required roles

## 6\. Reference: Paper Form Fields

To help you build an accurate data model, here are the fields from each paper form:

### Breakfast Form Fields
  * Frühstück lt. Plan (Breakfast according to plan)
  * Bread items: Brötchen (bread roll), Vollkornbrötchen (whole grain roll), Graubrot (grey bread), Vollkornbrot (whole grain bread), Weißbrot (white bread), Knäckebrot (crispbread)
  * Brei (puree/porridge)
  * Bread preparation: geschnitten (sliced), geschmiert (spread)
  * Spreads: Butter, Margarine, Konfitüre (jam), Diab. Konfitüre (diabetic jam), Honig (honey), Käse (cheese), Quark, Wurst (sausage)
  * Beverages: Kaffee (coffee), Tee (tea), Milch heiß (hot milk), Milch kalt (cold milk)
  * Additions: Zucker (sugar), Süßstoff (sweetener), Kaffeesahne (coffee creamer)

### Lunch Form Fields
  * Portion size: Kleine Portion (small), Große Portion (large), Vollwertkost vegetarisch (whole-food vegetarian)
  * Suppe (soup)
  * Dessert
  * Special preparations: passierte Kost (pureed food), passiertes Fleisch (pureed meat), geschnittenes Fleisch (sliced meat), Kartoffelbrei (mashed potatoes)
  * Restrictions: ohne Fisch (no fish), Fingerfood, nur süß (only sweet)

### Dinner Form Fields
  * Abendessen lt. Plan (Dinner according to plan)
  * Bread items: Graubrot (grey bread), Vollkornbrot (whole grain bread), Weißbrot (white bread), Knäckebrot (crispbread)
  * Bread preparation: geschmiert (spread), geschnitten (sliced)
  * Spreads: Butter, Margarine
  * Suppe (soup), Brei (puree)
  * ohne Fisch (no fish)
  * Beverages: Tee (tea), Kakao (cocoa), Milch heiß (hot milk), Milch kalt (cold milk)
  * Additions: Zucker (sugar), Süßstoff (sweetener)

### Common Fields (All Forms)
  * Resident information: Name, Zimmer (room), Tisch (table), Station
  * Hochkalorisch (high calorie)
  * Abneigungen (aversions/dislikes)
  * Sonstiges (other notes)

## 7\. Seeding & Submission

### Seed Data Requirements

Your project **must** include a seed script that runs on `onInit` (in `payload.config.ts`). This script must create:

  * **Users:**
      * `admin@example.com` (password: `test`, role: `admin`)
      * `caregiver@example.com` (password: `test`, role: `caregiver`)
      * `kitchen@example.com` (password: `test`, role: `kitchen`)
  * **Sample Data:**
      * At least 5-10 sample residents with realistic information
      * At least 15-20 sample meal orders covering different residents, meal types, and dates
      * Mix of pending and completed orders to demonstrate the workflow

### Submission Instructions

You **do not** need to deploy this project.

1.  **Create a new public GitHub repository** for your solution
2.  **Build** your solution locally
3.  Ensure your seed script runs correctly on `pnpm dev`
4.  **Commit** all your code to your repository
5.  Include a **README.md** in your repository with:
      * Instructions on how to run the project locally
      * Confirmation that the seed script works and the login credentials
      * Brief explanation of your design decisions:
          * How you structured your data model and why
          * How you implemented access control for the three roles
          * How you designed the kitchen dashboard and aggregation
          * Any challenges you faced and how you solved them
6.  Email the link to your repository to with your job application to **jobs@layerfinance.com** (cc: **mihael.presecan@layerfinance.com**)

## 8\. Evaluation Criteria

Your solution will be evaluated on:

  * **Problem-solving approach:** How well you understood the workflow and translated it into a digital solution
  * **Data modeling:** Quality and appropriateness of your Payload collections and field structure
  * **Access control:** Proper implementation of role-based permissions
  * **User experience:** How intuitive and efficient the interfaces are for each role
  * **Code quality:** Clean, well-organized, and maintainable code
  * **Payload expertise:** Effective use of Payload's features and best practices

## 9\. Bonus Points (Optional)

These are not required but will make your application stand out:

  * **Enhanced UI:** Create a more polished kitchen dashboard using Payload's UI components instead of raw JSON
  * **Additional features:** Any other improvements that would make the system more useful in a real care home setting

Good luck! We look forward to seeing your creative solution.
