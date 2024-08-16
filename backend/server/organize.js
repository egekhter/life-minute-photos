module.exports = {
    setBatchDate: async function (items) {
        return new Promise(async (resolve, reject) => {
            let changed_items = {};

            for(let item_id in items) {
                let existing_item = itemsL.data[item_id];
                let master_item_date = existing_item.master_item_date;
                let item_date = items[item_id];
                let date = `${item_date.year}-${item_date.month}-${item_date.date}`;
                let time = '00:00:00';
                if(master_item_date) {
                    time = master_item_date.substring(11, 19)
                }

                let new_date_time = `${date} ${time}`;

                if(master_item_date && master_item_date === new_date_time) {
                    continue;
                }

                existing_item.master_item_date = new_date_time;
                changed_items[item_id] = existing_item;
            }

            try {
                await updatePartitionSingle(dbL.partition.items.schema_name, _.toArray(changed_items));
            } catch (e) {
            }

            return resolve(changed_items);
        });
    },
    setBatchDelete: async function (items) {
        return new Promise(async (resolve, reject) => {
            let changed_items = [];

            for(let item_id of items) {
                let existing_item = itemsL.data[item_id];
                existing_item.deleted = timeNow();

                changed_items.push(existing_item);
            }

            try {
                await updatePartitionSingle(dbL.partition.items.schema_name, changed_items);
            } catch (e) {
            }

            return resolve(changed_items);
        });
    },
    resetData: function () {

    }
}