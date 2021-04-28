# Overview
This is a containerized web scraper and mongodb to pull tournament data from various poker sites


# How to run
1. `docker-compose up -d mongo`
2. Wait about a minute for the database to initalize (was too lazy to write a wait-for script)
3. To run the scrapers in a docker container run `docker-compose up -d scrapers`.  To run the scrapers on the host machine run `yarn start` instead.  They will connect to the mongo instance through port 2001 as specified in the `host.env` file.


# View the data
You can use any mongo client and connect to the instance with the credentials specified in the `.env` file at `localhost:2001` or run this: `docker exec -it db mongo` to get a mongo shell.

# What is being scraped
So far, all tournaments from https://swcpoker.club, https://stockpokeronline.com, and https://roundercasino.com.  Will add more.

# Data 

Todo: emebed screenshot

![Screenshot of database](https://github.com/dchrostowski/poker_tournament_scraper/blob/master/data.png?raw=true)


