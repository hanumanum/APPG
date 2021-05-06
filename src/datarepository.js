function dataRepository(_data) {
    _data = fixAPPandSource(_data)
    _data = checkData(_data)
    _data = addOrderNumbers(_data)

    const data = _data
    const filter = {
        text: undefined,
        year: undefined,
        top: true
    }

    function getAll() {
        return data;
    }

    function addFilter(type, value) {
        filter[type] = value
    }

    function removeFilter(type) {
        filter[type] = undefined
    }

    function getFiltered() {
        filter.year = (filter.year == "All years") ? filter.year = undefined : filter.year

        if (filter.top && filter.text) {
            filter.top = false
            return getFiltered()
        }
        else if (filter.year && !filter.text) {
            const topData = filterByTop()
            return filterByFilter(topData)
        }
        else if (!filter.top && (filter.year || filter.text)) {
            return filterByFilter(data)
        }
        else {
            return filterByTop()
        }
    }


    function filterByTop() {
        const grantTotalsData = calcGrantTotals(data, 'appg', 4)
        const topsArray = grantTotalsData.map(function (currentValue) {
            return Object.keys(currentValue)[0]
        })

        function filterCondition(currentValue) {
            return topsArray.includes(currentValue.appg)
        }

        return data.filter(filterCondition)
    }


    function filterByFilter(data) {
        function getFilterContition(v) {
            const defaultFilter = (v.source == filter.text || v.appg == filter.text || v.mps.includes(filter.text))
            const yearFilter = (v.date == filter.year)

            if (filter.year && filter.text == undefined) {
                return yearFilter
            }
            else if (filter.text && filter.year == undefined) {
                return defaultFilter
            }
            else {
                return defaultFilter && yearFilter
            }

        }

        return data.filter(getFilterContition)
    }


    function getSuggestionList(keyname) {
        return data.map(function (d) { return d[keyname] }).filter(distinct).sort()
    }


    function getMPsList() {
        return data.reduce(function (accumulator, currentValue) {
            return accumulator.concat(currentValue.mps)
        }, []).filter(distinct).sort()
    }


    /* Utilit functions */

    function fixAPPandSource(data) {
        if (!DEBUG) {
            return data
        }

        console.warn("DATA ERRORS FIXED, BUT YOU NEED TO CHECK DATA")
        return data.map(function (d) {
            if (d.appg === d.source) {
                d.source += "_"
            }
            return d
        })
    }


    function checkData(data) {
        const same = data.filter(function (d) {
            return d.appg === d.source
        })

        if (same.length) throw new UserException('appg and source can`t be same', same);

        return data
    }

    function addOrderNumbers(data) {
        return data.map(function (val, ind) {
            val.number = ind
            return val
        })
    }

    function calcGrantTotals(_data, field, topCount = 10) {
        function calcGrants(accumulator, currentValue) {
            //console.log(currentValue[field])

            if (!(currentValue[field] in accumulator)) {
                accumulator[currentValue[field]] = 0
            }
            accumulator[currentValue[field]] += currentValue['total']
            return accumulator
        }

        function makeArrayFromObject(accumulator, currentValue) {
            accumulator.push({ [currentValue]: grantTotals[currentValue] })
            return accumulator;
        }

        function sorter(a, b) {
            return b[Object.keys(b)[0]] - a[Object.keys(a)[0]]
        }


        const grantTotals = data.reduce(calcGrants, {})
        const grantTotalsOrdered = Object.keys(grantTotals)
            .reduce(makeArrayFromObject, [])
            .sort(sorter)
            .splice(0, topCount)


        return grantTotalsOrdered

    }


    function getValueBounds() {
        const max = data.reduce(function (accumulator, currentValue) {
            return Math.max(accumulator, currentValue.total)
        }, 0)

        const min = data.reduce(function (accumulator, currentValue) {
            return Math.min(accumulator, currentValue.total)
        }, max)

        const rato = max / min

        return { min, max, rato }
    }


    function groupByAPPG(data) {
        const onlyappg = function (v) { return v.appg }
        const reformat = function (v) { return { appg: v, transactions: [] } }
        const sum = function (a, c) { return a += c.total }
        const sorter = function (a, b) { return b.total - a.total }


        const findTransactons = function (data, appg) {
            return data.filter(function (v) {
                return v.appg == appg
            })
        }

        const fillTansactions = function (v) {
            v.transactions = findTransactons(data, v.appg)
            return v
        }

        const calctotals = function (v) {
            v.total = v.transactions.reduce(sum, 0)
            return v
        }

        const sortByTotals = function (v) {
            v.transactions = v.transactions.sort(sorter)
            return v
        }

        return data
            .map(onlyappg)
            .filter(distinct)
            .sort()
            .map(reformat)
            .map(fillTansactions)
            .map(calctotals)
            .map(sortByTotals)

    }

    return { groupByAPPG, getFiltered, getAll, addFilter, removeFilter, getSuggestionList, getMPsList, getValueBounds }

}