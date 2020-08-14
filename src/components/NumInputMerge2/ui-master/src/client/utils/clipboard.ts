export function copyStringToClipboard(str: string) {
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.setAttribute('style', '{ position: \'absolute\', left: \'-9999px\' }');
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}
