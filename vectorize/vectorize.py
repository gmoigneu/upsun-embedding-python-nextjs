from sentence_transformers import SentenceTransformer
import psycopg2
import os
from decimal import Decimal
import re
import csv

def generate_embeddings(data):
    # Generate embeddings for the extracted data
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    embeddings = model.encode(data)
    # Return the embeddings
    return embeddings

def prepare_database(conn, cur):
    # cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
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
        "embedding vector(384) NULL)"
    )
    # Empty table
    cur.execute('TRUNCATE TABLE watches')
    conn.commit()

def main():
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

    # Loop over df and print each row with a : separator between columns
    with open('data/watches-full.csv', 'r', encoding='utf-8-sig') as file:
        reader = csv.DictReader(file)
        for row in reader:
            # Add a : separator between the column name and value
            extract = [f"{column}: {value}" for column, value in row.items()]
            # Join the columns into a single string
            extract = "\r\n".join(extract)
            # Append the extract to the extracted_data array
            extracted_data.append(extract)

    # Generate embeddings for the extracted data
    embeddings = generate_embeddings(extracted_data)

    # Store the watch and the embedding in pgsql
    with open('data/watches-full.csv', 'r', encoding='utf-8-sig') as file:
        reader = csv.DictReader(file)
        index = 0
        for row in reader:
            cur.execute(
                'INSERT INTO watches ("brand", "model", "case_material", "strap_material", "movement_type", "water_resistance", "case_diameter_mm", "case_thickness_mm", "band_width_mm", "dial_color", "crystal_material", "complications", "power_reserve", "price_usd", "embedding") VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)',
                (
                    row['Brand'],
                    row['Model'],
                    row['Case Material'],
                    row['Strap Material'],
                    row['Movement Type'],
                    row['Water Resistance'],
                    Decimal(row['Case Diameter (mm)']),
                    Decimal(row['Case Thickness (mm)']),
                    Decimal(row['Band Width (mm)']),
                    row['Dial Color'],
                    row['Crystal Material'],
                    row['Complications'],
                    row['Power Reserve'],
                    int(re.sub("[^0-9.]", "", row['Price (USD)'])),
                    embeddings[index].tolist()
                )
            )
            ++index
    conn.commit()

    # Close the cursor and connection
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
