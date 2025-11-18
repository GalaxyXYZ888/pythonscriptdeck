# AI Code Generator - Code Templates

This document describes all the pre-built code templates available in the AI Code Generator action.

## How to Use Templates

1. Add the **AI Code Generator** action to your Stream Deck
2. Open the Property Inspector
3. **Select your AI Provider** (OpenAI, Anthropic, Google, or Groq) - See [AI_PROVIDERS.md](AI_PROVIDERS.md)
4. **Choose a Model** from the dropdown
5. **Enter your API Key** for the selected provider
6. Select a template from the **Code Templates** dropdown
7. The prompt field will auto-populate with the template description
8. Click **Generate Code** to create the Python script
9. Review the generated code and click **Execute Code** to run it

## Available Templates

### 📊 System Information

#### Current Date & Time
**Prompt:** "Create a Python script that prints the current date and time in a readable format"
- Displays formatted date and time
- Useful for quick time checks

#### System Information
**Prompt:** "Create a Python script that displays system information including OS, Python version, and hostname"
- Shows operating system details
- Python version information
- Computer hostname

#### Disk Space Usage
**Prompt:** "Create a Python script that shows disk space usage for all drives"
- Lists all disk drives
- Shows used and available space
- Displays percentages

#### CPU Usage Monitor
**Prompt:** "Create a Python script that monitors and displays current CPU usage percentage"
- Real-time CPU usage
- Percentage-based display

#### Memory Usage
**Prompt:** "Create a Python script that displays current memory usage in GB and percentage"
- RAM usage in GB
- Percentage of total memory
- Available memory

---

### 📁 File Operations

#### List Files in Directory
**Prompt:** "Create a Python script that lists all files in the current directory with their sizes"
- Shows all files
- Displays file sizes
- Human-readable format

#### Count Files by Extension
**Prompt:** "Create a Python script that counts files by extension in the current directory"
- Groups files by type
- Shows count for each extension
- Useful for directory analysis

#### Get File Size
**Prompt:** "Create a Python script that gets the size of a specific file in a human-readable format"
- File size in KB/MB/GB
- Human-readable output

#### Create File Backup
**Prompt:** "Create a Python script that creates a timestamped backup copy of a file"
- Automatic timestamp
- Safe backup creation
- Preserves original file

#### Find Files by Pattern
**Prompt:** "Create a Python script that finds all files matching a specific pattern in a directory"
- Pattern matching
- Recursive search option
- Lists matching files

---

### 🌐 Network & APIs

#### Fetch Weather Data
**Prompt:** "Create a Python script that fetches current weather data for a city using a free weather API"
- Current weather conditions
- Temperature display
- City-based lookup

#### Bitcoin Price
**Prompt:** "Create a Python script that fetches the current Bitcoin price in USD"
- Real-time BTC price
- USD conversion
- Quick crypto check

#### Random Quote
**Prompt:** "Create a Python script that fetches a random inspirational quote from an API"
- Inspirational quotes
- Random selection
- API-powered

#### Get Public IP Address
**Prompt:** "Create a Python script that gets and displays your public IP address"
- Shows your public IP
- Quick network check

#### Check Website Status
**Prompt:** "Create a Python script that checks if a website is online and returns the HTTP status code"
- Website availability
- HTTP status codes
- Response time

---

### 🛠️ Utilities

#### Random Number Generator
**Prompt:** "Create a Python script that generates a random number between 1 and 100"
- Random number generation
- Customizable range
- Quick randomization

#### Random Password Generator
**Prompt:** "Create a Python script that generates a secure random password with letters, numbers, and symbols"
- Secure passwords
- Mixed character types
- Customizable length

#### Countdown Timer
**Prompt:** "Create a Python script that counts down from 10 to 0 with 1-second intervals"
- Visual countdown
- Customizable duration
- Real-time display

#### Calculate Factorial
**Prompt:** "Create a Python script that calculates the factorial of a number (e.g., 10)"
- Mathematical calculations
- Factorial computation
- Large number support

#### Fibonacci Sequence
**Prompt:** "Create a Python script that generates the first 10 numbers in the Fibonacci sequence"
- Fibonacci numbers
- Customizable count
- Mathematical sequences

#### Generate UUID
**Prompt:** "Create a Python script that generates a random UUID"
- Unique identifiers
- UUID v4 generation
- Quick ID creation

---

### 📈 Data Processing

#### Parse JSON File
**Prompt:** "Create a Python script that reads and parses a JSON file and displays its contents"
- JSON file reading
- Pretty-print output
- Data inspection

#### Read CSV File
**Prompt:** "Create a Python script that reads a CSV file and displays the first 5 rows"
- CSV file parsing
- Preview data
- Tabular display

#### Text File Statistics
**Prompt:** "Create a Python script that analyzes a text file and shows line count, word count, and character count"
- File analysis
- Multiple metrics
- Quick statistics

#### Word Counter
**Prompt:** "Create a Python script that counts the frequency of each word in a text string"
- Word frequency analysis
- Text processing
- Sorted results

---

## Tips for Using Templates

1. **Customize the Prompt**: After selecting a template, you can modify the prompt to better suit your needs
2. **Combine Ideas**: Use templates as starting points and add your own requirements
3. **API Keys**: Some templates (weather, quotes) may require API keys - the AI will generate code that you can customize
4. **File Paths**: Templates that work with files will need you to specify actual file paths after generation
5. **Error Handling**: Generated code includes basic error handling, but you can ask the AI to add more

## Creating Custom Templates

While these templates cover common use cases, you can always write your own prompts! Be specific about:
- What the script should do
- What output format you want
- Any specific libraries or methods to use
- Error handling requirements

## Example Workflow

1. Select **"Bitcoin Price"** template
2. Click **Generate Code**
3. Review the generated Python script
4. Click **Execute Code** or press the Stream Deck button
5. See the current BTC price displayed!

---

**Total Templates Available:** 28 templates across 5 categories

