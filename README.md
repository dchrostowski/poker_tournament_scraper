# Overview
This is a containerized web scraper and mongodb to pull tournament data from various poker sites


# How to run
1. `docker-compose up -d mongo`
2. Wait about a minute for the database to initalize (was too lazy to write a wait-for script)
3. `docker-compose up -d scrapers`


# View the data
You can use any mongo client and connect to the instance with the credentials specified in the `.env` file at `localhost:2001` or run this: `docker exec -it db mongo` to get a mongo shell.

# What is being scraped
So far, all tournaments from https://swcpoker.club and all tournaments from https://stockpokeronline.com

Planning to add https://roundercasino.com soon.






