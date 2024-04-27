use arrow::{
    array::{ArrayData, ArrayDataBuilder, LargeBinaryArray},
    buffer::Buffer,
    datatypes::{DataType, ToByteSlice},
};
use arrow_array::Array;
use arrow_schema::Field;
use std::sync::Arc;

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

pub fn create_array_data_2d(list: &Vec<Vec<Vec<u8>>>, field_name: &str) -> ArrayData {
    let mut values = Vec::<Vec<u8>>::from([]);
    let mut offsets = Vec::from([0i32]);
    let mut offset = 0i32;

    let mut i = 0;
    while i < list.len() {
        let mut j = 0;
        while j < list[i].len() {
            values.push(list[i][j].clone());
            j = j + 1;
        }

        offset += list[i].len() as i32;
        offsets.push(offset);

        i = i + 1;
    }

    let child = LargeBinaryArray::from_iter_values(values.iter());

    let array_data = ArrayDataBuilder::new(DataType::List(Arc::new(Field::new(
        field_name,
        DataType::LargeBinary,
        false,
    ))))
    .add_child_data(child.into_data())
    .len(list.len())
    .add_buffer(Buffer::from(offsets.to_byte_slice()))
    .build()
    .unwrap();

    return array_data;
}
