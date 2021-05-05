// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { config } from 'process';
import * as vscode from 'vscode';

const userConfig = vscode.workspace.getConfiguration('monies');

const minsPerYear = (60 * 8 * (5 * 52 - userConfig.averageVacationDays)) || 1;
const hourly: number = (userConfig.annualSalary) 
    ? userConfig.annualSalary / minsPerYear 
    : userConfig.hourlyWage / 60;

const formatter = buildCurrencyFormatter(userConfig.monetaryUnit);

let updateId: NodeJS.Timeout;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let {subscriptions} = context;
    let moniesStatusItem: vscode.StatusBarItem = vscode.window.createStatusBarItem();

    function updateCounter(start: number) {
        moniesStatusItem.text = formatter(start);
        updateId = setTimeout(() => updateCounter(start + hourly), 60000);
    }
    let startTime = getTodayNthHour(userConfig.startTime);
    updateCounter(minsSince(startTime));

    let visible = true;
    let toggleFunc = () => {
        visible ? moniesStatusItem.hide() : moniesStatusItem.show();
        visible = !visible;
    };
   
    let toggleId = 'monies.toggleStatus';
    moniesStatusItem.show();

    subscriptions.push(vscode.commands.registerCommand(toggleId, toggleFunc));
    moniesStatusItem.command = toggleId;
    subscriptions.push(moniesStatusItem);
    console.log(subscriptions);
}

function getTodayNthHour(n: number): Date {
    let cur = new Date();
    cur.setMinutes(0);
    cur.setHours(n);
    return cur;
}

function minsSince(time: Date): number {
    let cur = new Date();
    let [hrs, mins] = [cur.getHours(), cur.getMinutes()];
    return ((hrs * 60) + mins) - (time.getHours() * 60);
}

// this method is called when your extension is deactivated
export function deactivate() {
    (updateId !== undefined) && clearTimeout(updateId);
}

function buildCurrencyFormatter(unit: string): (amt: number) => string {
    let symbols = {
        'pound': '£',
        'dollar': '$',
        'peso': '$',
        'yen': '¥',
        'yuan': '¥',
        'euro': '€',
        'rupee': '₹',
        'won': '₩',
    };
    for (let key in symbols) {
        // @ts-ignore
        let val = symbols[key];
        // @ts-ignore
        symbols[val] = val;
    }
    // @ts-ignore
    let res: string | undefined = symbols[unit];
    return (res !== undefined) 
        ? (amt => `${res}${amt.toFixed(2)}`)
        : (amt => `${amt.toFixed(2)}${unit}`);
}