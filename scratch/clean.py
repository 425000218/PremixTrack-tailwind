
import re
with open('SQL_PremixTrackDB.utf8.sql', 'r', encoding='utf-8') as f:
    content = f.read()

tables_to_remove = [
    'Fact_Forecast_Header',
    'Dim_PIC',
    'Fact_InterFactory_Transfer',
    'Fact_PurchaseOrder',
    'Formula_BOM',
    'Formula_BOM_Item'
]

# Simple block remover. A CREATE TABLE block starts with CREATE TABLE and ends with GO.
# An INSERT block starts with INSERT and ends with \n.
# An ALTER TABLE block starts with ALTER TABLE and ends with GO or \n.

for tbl in tables_to_remove:
    # Remove CREATE TABLE
    pattern_create = r'CREATE TABLE \[dbo\]\.\[{}\].*?GO\n'
    content = re.sub(pattern_create.format(tbl), '', content, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove INSERT
    pattern_insert = r'INSERT \[dbo\]\.\[{}\].*?\n'
    content = re.sub(pattern_insert.format(tbl), '', content, flags=re.IGNORECASE)
    
    # Remove ALTER TABLE
    pattern_alter = r'ALTER TABLE \[dbo\]\.\[{}\].*?\n'
    content = re.sub(pattern_alter.format(tbl), '', content, flags=re.IGNORECASE)

    # Remove FK constraints and others that might have GO
    pattern_alter_go = r'ALTER TABLE \[dbo\]\.\[{}\].*?GO\n'
    content = re.sub(pattern_alter_go.format(tbl), '', content, flags=re.DOTALL | re.IGNORECASE)

with open('SQL_PremixTrackDB.sql', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')

