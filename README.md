# L9aDar

> **Find your place. Find your people.**

L9aDar is a Moroccan student housing and roommate-matching platform.

A single account can both **find a home** and **list a home**. Users can also discover compatible roommates, apply to rooms, message people, save listings, and manage their own listings.

## Main Workflow

### Find a home
```text
Create account
→ Search homes
→ Open a listing
→ View location + available rooms + current household
→ Check household compatibility
→ Apply
→ Message
```

### Find a roommate
```text
Create roommate profile
→ Add lifestyle preferences
→ Search roommates
→ View compatible profiles
→ Compare match score
→ Open profile
→ Message
```

### List a home
```text
+ List a home
→ Tell us about your home
→ Location
→ Rooms
→ Photos
→ Price
→ Current household
→ Review
→ Publish
→ My listings
→ Received applications
```

## Core Features

- Fast signup and login
- One account, no Student/Host mode
- Housing search by city, university, budget and availability
- Home details with photos, rooms, amenities and approximate map location
- Roommate discovery
- Roommate lifestyle profile
- Compatibility / matching system
- Person ↔ Person matching
- Person ↔ Household matching
- Current household with L9aDar and non-L9aDar residents
- `+ List a home` for any logged-in user
- My listings
- Room occupancy management
- My applications
- Received applications
- Real-time messaging
- Saved homes
- Notifications

## Roommate Matching

The roommate profile can include:

- Sleep schedule
- Cleanliness
- Smoking preference
- Social lifestyle
- Guests
- Pets

L9aDar uses these preferences to calculate compatibility.

```text
User A ↔ User B
        ↓
Lifestyle compatibility
        ↓
Match score
```

Example:

```text
Lifestyle        92%
Cleanliness      95%
Sleep Schedule   88%
Social Habits    90%

Overall Match    91%
```

The platform can also calculate:

```text
Person ↔ Household
```

Only household members with completed L9aDar profiles are included.

Example:

```text
2 residents
1 has a L9aDar profile
1 is not on L9aDar

→ Compatibility based on 1 of 2 household members
```

If no valid profile data exists:

```text
Compatibility unavailable
```

## Account Logic

Users are not assigned a permanent role.

A user can:

```text
Search homes
Search roommates
Apply to rooms
Message users
List a home
Manage listings
Receive applications
```

The user's relationship is stored per listing:

```text
Owner / manager
or
Current resident
```

## Map

The map is mainly used on **Home Details**.

Show:

```text
8 min from ENSIAS
Agdal, Rabat
Approximate location shown
```

The exact public address should remain private.

## Navigation

### Logged out
```text
Home | Search | Roommates | How it works | Log in/Sign up
```

### Logged in
```text
Home | Search | Roommates | Messages | + List a home | Notifications | Profile
```

## Architecture

```text
(ma3rf)
```

WebSockets are used for real-time messaging and notifications.

## MVP Goal

A user should be able to:

```text
Find a home
→ See who lives there
→ Check compatibility
→ Apply
→ Message
```

or:

```text
Find a roommate
→ Compare compatibility
→ Message
```

or:

```text
+ List a home
→ Publish
→ Receive applications
→ Review / Message / Accept
```
