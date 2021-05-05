import * as vscode from 'vscode';

const userConfig = vscode.workspace.getConfiguration('monies');

const minsPerYear = (60 * 8 * (5 * 52 - userConfig.averageVacationDays)) || 1;
const hourly: number = (userConfig.annualSalary) 
    ? userConfig.annualSalary / minsPerYear 
    : userConfig.hourlyWage / 60;

const formatter = buildCurrencyFormatter(userConfig.monetaryUnit);

let updateId: NodeJS.Timeout;

function getTodayNthHour(n: number): Date {
    let cur = new Date();
    cur.setMinutes(0);
    cur.setHours(n);
    return cur;
}

function minsSince(time: Date): number {
    let cur = new Date();
    return ((cur.getHours() * 60) + cur.getMinutes()) - (time.getHours() * 60);
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
   
    userConfig.showOnLoad && moniesStatusItem.show();

    let toggleId = 'monies.toggleStatus';

    subscriptions.push(vscode.commands.registerCommand(toggleId, toggleFunc));
    moniesStatusItem.command = toggleId;
    subscriptions.push(moniesStatusItem);
    console.log(subscriptions);
}

export function deactivate() {
    (updateId !== undefined) && clearTimeout(updateId);
}