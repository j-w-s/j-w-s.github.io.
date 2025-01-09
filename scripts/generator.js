const state = {
    anchorPoint1: { r: 27, g: 31, b: 7 },
    anchorPoint2: { r: 245, g: 241, b: 237 },
    paletteSize: 4,
    activeHSLType: 'hue',
    activeRangeIndex: 0,
    hueRanges: [[0.0, 1.0]],
    satRanges: [[0.125, 0.875]],
    lightRanges: [[0.1, 0.9]],
    palette: []
};

function initializeAnchorInputs() {
    document.getElementById('a1r').value = state.anchorPoint1.r;
    document.getElementById('a1g').value = state.anchorPoint1.g;
    document.getElementById('a1b').value = state.anchorPoint1.b;

    document.getElementById('a2r').value = state.anchorPoint2.r;
    document.getElementById('a2g').value = state.anchorPoint2.g;
    document.getElementById('a2b').value = state.anchorPoint2.b;

    ['a1r', 'a1g', 'a1b'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateAnchorPoint1);
    });

    ['a2r', 'a2g', 'a2b'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateAnchorPoint2);
    });
}

function updateAnchorPoint1() {
    state.anchorPoint1 = {
        r: parseInt(document.getElementById('a1r').value) || 0,
        g: parseInt(document.getElementById('a1g').value) || 0,
        b: parseInt(document.getElementById('a1b').value) || 0
    };
    generatePalette();
}

function updateAnchorPoint2() {
    state.anchorPoint2 = {
        r: parseInt(document.getElementById('a2r').value) || 0,
        g: parseInt(document.getElementById('a2g').value) || 0,
        b: parseInt(document.getElementById('a2b').value) || 0
    };
    generatePalette();
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}

function rgbToHex(rgb) {
    return '#' + rgb.map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function isRangeValid(range) {
    const [min, max] = range;
    return min >= 0 && max <= 1 && min < max;
}

function doRangesOverlap(range1, range2) {
    return !(range1[1] <= range2[0] || range2[1] <= range1[0]);
}

function areRangesValid(ranges) {
    if (!Array.isArray(ranges) || ranges.length === 0) return false;
    
    if (!ranges.every(isRangeValid)) return false;
    
    ranges = ranges.slice().sort((a, b) => a[0] - b[0]);
    
    for (let i = 0; i < ranges.length - 1; i++) {
        if (doRangesOverlap(ranges[i], ranges[i + 1])) return false;
    }
    
    return true;
}

function getCurrentRanges() {
    switch(state.activeHSLType) {
        case 'hue': return state.hueRanges;
        case 'saturation': return state.satRanges;
        case 'lightness': return state.lightRanges;
        default: return state.hueRanges;
    }
}

function setRanges(type, ranges) {
    if (!areRangesValid(ranges)) return false;
    
    const newRanges = ranges.map(range => [...range]).sort((a, b) => a[0] - b[0]);
    
    switch(type) {
        case 'hue':
            state.hueRanges = newRanges;
            break;
        case 'saturation':
            state.satRanges = newRanges;
            break;
        case 'lightness':
            state.lightRanges = newRanges;
            break;
        default:
            return false;
    }
    
    generatePalette();
    return true;
}

function isBalancedColor(point) {
    const [h, s, l] = rgbToHsl(point.r, point.g, point.b);
    return (
        state.hueRanges.some(([min, max]) => h >= min && h <= max) &&
        state.satRanges.some(([min, max]) => s >= min && s <= max) &&
        state.lightRanges.some(([min, max]) => l >= min && l <= max)
    );
}

function distance(x, y) {
    return Math.max(
        Math.abs(x.r - y.r),
        Math.abs(x.g - y.g),
        Math.abs(x.b - y.b)
    );
}

function updateRangeSelect() {
    const select = document.getElementById('rangeSelect');
    const ranges = getCurrentRanges();
    
    select.innerHTML = ranges.map((range, i) => `
        <option value="${i}">Range ${i + 1} (${range[0].toFixed(2)} - ${range[1].toFixed(2)})</option>
    `).join('');
    
    select.value = state.activeRangeIndex;
    updateRangeControls();
}

function updateRangeControls() {
    const ranges = getCurrentRanges();
    const currentRange = ranges[state.activeRangeIndex];
    
    const minInput = document.getElementById('rangeMin');
    const maxInput = document.getElementById('rangeMax');
    const minValue = document.getElementById('rangeMinValue');
    const maxValue = document.getElementById('rangeMaxValue');
    
    minInput.value = currentRange[0];
    maxInput.value = currentRange[1];
    minValue.textContent = currentRange[0].toFixed(2);
    maxValue.textContent = currentRange[1].toFixed(2);
}

function updateRangeList() {
    const container = document.getElementById('rangeItems');
    const ranges = getCurrentRanges();
    
    container.innerHTML = ranges.map((range, i) => `
        <div class="menu-item ${i === state.activeRangeIndex ? 'active' : ''}">
            Range ${i + 1}: ${range[0].toFixed(2)} - ${range[1].toFixed(2)}
        </div>
    `).join('');
}

function updatePaletteGrid() {
    const grid = document.getElementById('paletteGrid');
    
    grid.innerHTML = state.palette.map(color => `
        <div class="color-card">
            <div class="color-preview" style="background-color: ${rgbToHex([color.r, color.g, color.b])}"></div>
            <div class="color-info">
                <p>RGB: ${color.r}, ${color.g}, ${color.b}</p>
                <p>Hex: ${rgbToHex([color.r, color.g, color.b])}</p>
            </div>
        </div>
    `).join('');
}

function generatePalette() {
    const size = Math.pow(2, state.paletteSize);
    const points = new Set([
        state.anchorPoint1,
        state.anchorPoint2
    ]);

    while (points.size < size) {
        let bestPoint = null;
        let maxMinDistance = -1;

        for (let r = 0; r <= 255; r += 5) {
            for (let g = 0; g <= 255; g += 5) {
                for (let b = 0; b <= 255; b += 5) {
                    const point = { r, g, b };
                    
                    if (!isBalancedColor(point)) continue;
                    
                    const minDistance = Math.min(
                        ...Array.from(points).map(p => distance(point, p))
                    );

                    if (minDistance > maxMinDistance) {
                        maxMinDistance = minDistance;
                        bestPoint = point;
                    }
                }
            }
        }

        if (bestPoint) {
            points.add(bestPoint);
        } else {
            break;
        }
    }

    state.palette = Array.from(points).sort((a, b) => {
        const [, , la] = rgbToHsl(a.r, a.g, a.b);
        const [, , lb] = rgbToHsl(b.r, b.g, b.b);
        return la - lb;
    });

    updatePaletteGrid();
}

function initializeEventListeners() {
    document.querySelectorAll('[data-type]').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('[data-type]').forEach(btn => 
                btn.classList.remove('active')
            );
            button.classList.add('active');
            state.activeHSLType = button.dataset.type;
            state.activeRangeIndex = 0;
            updateRangeSelect();
            updateRangeList();
        });
    });

    document.getElementById('rangeSelect').addEventListener('change', (e) => {
        state.activeRangeIndex = parseInt(e.target.value);
        updateRangeControls();
        updateRangeList();
    });

    document.getElementById('rangeMin').addEventListener('input', (e) => {
        const ranges = getCurrentRanges();
        const value = parseFloat(e.target.value);
        const maxValue = parseFloat(document.getElementById('rangeMax').value);
        
        if (value < maxValue) {
            ranges[state.activeRangeIndex][0] = value;
            document.getElementById('rangeMinValue').textContent = value.toFixed(2);
            if (setRanges(state.activeHSLType, ranges)) {
                updateRangeSelect();
                updateRangeList();
            }
        }
    });

    document.getElementById('rangeMax').addEventListener('input', (e) => {
        const ranges = getCurrentRanges();
        const value = parseFloat(e.target.value);
        const minValue = parseFloat(document.getElementById('rangeMin').value);
        
        if (value > minValue) {
            ranges[state.activeRangeIndex][1] = value;
            document.getElementById('rangeMaxValue').textContent = value.toFixed(2);
            if (setRanges(state.activeHSLType, ranges)) {
                updateRangeSelect();
                updateRangeList();
            }
        }
    });

    document.getElementById('addRange').addEventListener('click', () => {
        const ranges = getCurrentRanges();
        if (ranges.length >= 5) return;

        const sortedRanges = [...ranges].sort((a, b) => a[0] - b[0]);
        let newRange = null;

        for (let i = 0; i < sortedRanges.length - 1; i++) {
            const gap = sortedRanges[i + 1][0] - sortedRanges[i][1];
            if (gap >= 0.1) {
                newRange = [
                    sortedRanges[i][1],
                    Math.min(sortedRanges[i][1] + gap/2, sortedRanges[i + 1][0])
                ];
                break;
            }
        }
    
        if (!newRange) {
            if (sortedRanges[0][0] > 0.1) {
                newRange = [0, sortedRanges[0][0] - 0.05];
            } else if (sortedRanges[sortedRanges.length - 1][1] < 0.9) {
                newRange = [
                    sortedRanges[sortedRanges.length - 1][1],
                    Math.min(sortedRanges[sortedRanges.length - 1][1] + 0.1, 1)
                ];
            }
        }

        if (newRange && setRanges(state.activeHSLType, [...ranges, newRange])) {
            state.activeRangeIndex = ranges.length;
            updateRangeSelect();
            updateRangeList();
        }
    });

    document.getElementById('removeRange').addEventListener('click', () => {
        const ranges = getCurrentRanges();
        if (ranges.length <= 1) return;

        const newRanges = ranges.filter((_, i) => i !== state.activeRangeIndex);
        if (setRanges(state.activeHSLType, newRanges)) {
            state.activeRangeIndex = Math.min(state.activeRangeIndex, newRanges.length - 1);
            updateRangeSelect();
            updateRangeList();
        }
    });

    document.getElementById('paletteSize').addEventListener('input', (e) => {
        const value = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 6);
        e.target.value = value;
        state.paletteSize = value;
        document.getElementById('actualSize').textContent = `= ${Math.pow(2, value)}`;
    });

    document.getElementById('generate').addEventListener('click', generatePalette);

    document.getElementById('copyColors').addEventListener('click', async () => {
        const colors = state.palette.map(color => 
            `RGB: ${color.r}, ${color.g}, ${color.b}\n` +
            `Hex: ${rgbToHex([color.r, color.g, color.b])}`
        ).join('\n\n');

        try {
            await navigator.clipboard.writeText(colors);
            alert('Colors copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy colors:', err);
            const textarea = document.createElement('textarea');
            textarea.value = colors;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('Colors copied to clipboard!');
        }
    });

    const anchorInputs = document.querySelectorAll('input[type="number"]');
    anchorInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            let value = parseInt(e.target.value);
            if (isNaN(value)) {
                value = 0;
            } else if (value < 0) {
                value = 0;
            } else if (value > 255) {
                value = 255;
            }
            e.target.value = value;
        });
    });
}

function resetState() {
    state.hueRanges = [[0.0, 1.0]];
    state.satRanges = [[0.125, 0.875]];
    state.lightRanges = [[0.1, 0.9]];
    state.activeRangeIndex = 0;
    state.activeHSLType = 'hue';
    
    document.querySelectorAll('[data-type]').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === 'hue') {
            btn.classList.add('active');
        }
    });
    
    updateRangeSelect();
    updateRangeControls();
    updateRangeList();
    generatePalette();
}

function init() {
    try {
        initializeAnchorInputs();
        initializeEventListeners();
        
        document.getElementById('actualSize').textContent = `= ${Math.pow(2, state.paletteSize)}`;
        
        updateRangeSelect();
        updateRangeControls();
        updateRangeList();
        
        generatePalette();
    } catch (error) {
        console.error('Initialization error:', error);
        resetState();
    }
}

function handleError(fn) {
    return function(...args) {
        try {
            fn.apply(this, args);
        } catch (error) {
            console.error('Operation error:', error);
            resetState();
        }
    };
}

function wrapEventListeners() {
    const eventElements = {
        'rangeSelect': ['change'],
        'rangeMin': ['input'],
        'rangeMax': ['input'],
        'addRange': ['click'],
        'removeRange': ['click'],
        'paletteSize': ['input'],
        'generate': ['click'],
        'copyColors': ['click']
    };

    Object.entries(eventElements).forEach(([id, events]) => {
        const element = document.getElementById(id);
        if (element) {
            events.forEach(event => {
                const oldListener = element[`on${event}`];
                if (oldListener) {
                    element[`on${event}`] = handleError(oldListener);
                }
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    wrapEventListeners();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        state,
        rgbToHsl,
        rgbToHex,
        isRangeValid,
        doRangesOverlap,
        areRangesValid,
        getCurrentRanges,
        setRanges,
        isBalancedColor,
        distance,
        generatePalette
    };
}