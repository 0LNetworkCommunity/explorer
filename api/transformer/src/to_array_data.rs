use arrow::{array::ArrayData, buffer::Buffer, datatypes::DataType};

pub trait ToArrayData {
    fn to_array_data(&self) -> ArrayData;
}

impl ToArrayData for Vec<Vec<u8>> {
    fn to_array_data(&self) -> ArrayData {
        let mut offsets: Vec<i32> = Vec::with_capacity(self.len() + 1);
        offsets.push(0);

        let mut total_len = 0;

        let mut i = 0;
        while i < self.len() {
            let len = self[i].len() as i32;
            total_len = total_len + len;
            offsets.push(total_len);
            i = i + 1;
        }

        let mut values: Vec<u8> = Vec::with_capacity(total_len as usize);
        i = 0;
        while i < self.len() {
            let mut it = self[i].clone();
            it.reverse();
            values.extend(&it);
            i = i + 1;
        }

        let array_data = ArrayData::builder(DataType::Binary)
            .len(self.len())
            .add_buffer(Buffer::from_slice_ref(offsets))
            .add_buffer(Buffer::from_slice_ref(values))
            .build()
            .unwrap();

        return array_data;
    }
}

impl ToArrayData for Vec<Vec<u32>> {
    fn to_array_data(&self) -> ArrayData {
        let mut offsets: Vec<i32> = Vec::with_capacity(self.len() + 1);
        offsets.push(0);

        let mut total_len = 0;

        let mut i = 0;
        while i < self.len() {
            let len = self[i].len() as i32;
            total_len = total_len + len;
            offsets.push(total_len);
            i = i + 1;
        }

        let mut values: Vec<u32> = Vec::with_capacity(total_len as usize);
        i = 0;
        while i < self.len() {
            let mut it = self[i].clone();
            it.reverse();
            values.extend(&it);
            i = i + 1;
        }

        let array_data = ArrayData::builder(DataType::Binary)
            .len(self.len())
            .add_buffer(Buffer::from_slice_ref(offsets))
            .add_buffer(Buffer::from_slice_ref(values))
            .build()
            .unwrap();

        return array_data;
    }
}

impl ToArrayData for Vec<Vec<u64>> {
    fn to_array_data(&self) -> ArrayData {
        let mut offsets: Vec<i32> = Vec::with_capacity(self.len() + 1);
        offsets.push(0);

        let mut total_len = 0;

        let mut i = 0;
        while i < self.len() {
            let len = self[i].len() as i32;
            total_len = total_len + len;
            offsets.push(total_len);
            i = i + 1;
        }

        let mut values: Vec<u64> = Vec::with_capacity(total_len as usize);
        i = 0;
        while i < self.len() {
            let mut it = self[i].clone();
            it.reverse();
            values.extend(&it);
            i = i + 1;
        }

        let array_data = ArrayData::builder(DataType::Binary)
            .len(self.len())
            .add_buffer(Buffer::from_slice_ref(offsets))
            .add_buffer(Buffer::from_slice_ref(values))
            .build()
            .unwrap();

        return array_data;
    }
}