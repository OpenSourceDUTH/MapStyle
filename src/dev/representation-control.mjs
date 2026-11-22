export function addRepresentationSelect({getRepresentationIds, getActiveRepresentation, onChange}) {
    const select = document.createElement('select');
    select.className = 'representation-select';
    select.title = 'Choose map representation';
    for (const id of getRepresentationIds()) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = id;
        select.append(option);
    }
    select.value = getActiveRepresentation();
    select.addEventListener('change', event => onChange(event.target.value));
    document.body.append(select);
}
