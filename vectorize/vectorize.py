import pandas as pd
from openai import OpenAI
import psycopg2
import os
from decimal import Decimal
import re
from pprint import pprint

def generate_embeddings(client, data):
    # Generate embeddings for the extracted data
    response = client.embeddings.create(model="text-embedding-3-small", input=data)
    # Return the embeddings
    return response.data

def prepare_database(conn, cur):
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
    # Create the table if it doesn't exist
    cur.execute(
        "CREATE TABLE IF NOT EXISTS watches ("
        "id SERIAL PRIMARY KEY,"
        "brand VARCHAR(255),"
        "model VARCHAR(255),"
        "case_material VARCHAR(255) NULL,"
        "strap_material VARCHAR(255) NULL,"
        "movement_type VARCHAR(255) NULL,"
        "water_resistance VARCHAR(255) NULL,"
        "case_diameter_mm DECIMAL NULL,"
        "case_thickness_mm DECIMAL NULL,"
        "band_width_mm DECIMAL NULL,"
        "dial_color VARCHAR(255) NULL,"
        "crystal_material VARCHAR(255) NULL,"
        "complications VARCHAR(255) NULL,"
        "power_reserve VARCHAR(255) NULL,"
        "price_usd INT NULL,"    
        "embedding vector(1536) NULL)"
    )
    # Empty table
    cur.execute('TRUNCATE TABLE watches')
    conn.commit()

def main():
    client = OpenAI()
    client.api_key = os.getenv('OPENAI_KEY')

    conn = psycopg2.connect(
            dbname=os.getenv('DB_PATH'),
            user=os.getenv('DB_USERNAME'),
            password=os.getenv('DB_PASSWORD'),
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT')
        )

    cur = conn.cursor()

    prepare_database(conn, cur);

    # Create an empty array to store the extracted data
    extracted_data = []

    df = pd.read_csv('data/watches-full.csv')
    # Loop over df and print each row with a : separator between columns
    for index, row in df.iterrows():
        # Add a : separator between the column name and value
        extract = [f"{column}: {value}" for column, value in row.items()]
        # Join the columns into a single string
        extract = "\r\n".join(extract)
        # Append the extract to the extracted_data array
        extracted_data.append(extract)

    # Generate embeddings for the extracted data
    embeddings = generate_embeddings(client, extracted_data)

    # Store the watch and the embedding in pgsql
    for index, row in df.iterrows():
        cur.execute(
            'INSERT INTO watches ("brand", "model", "case_material", "strap_material", "movement_type", "water_resistance", "case_diameter_mm", "case_thickness_mm", "band_width_mm", "dial_color", "crystal_material", "complications", "power_reserve", "price_usd", "embedding") VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)',
            (
                row.loc['Brand'],
                row.loc['Model'],
                row.loc['Case Material'],
                row.loc['Strap Material'],
                row.loc['Movement Type'],
                row.loc['Water Resistance'],
                Decimal(row.loc['Case Diameter (mm)']),
                Decimal(row.loc['Case Thickness (mm)']),
                Decimal(row.loc['Band Width (mm)']),
                row.loc['Dial Color'],
                row.loc['Crystal Material'],
                row.loc['Complications'],
                row.loc['Power Reserve'],
                int(re.sub("[^0-9.]", "", row.loc['Price (USD)'])),
                embeddings[index].embedding)
        )
        conn.commit()

    # Close the cursor and connection
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()